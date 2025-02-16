<template>
  <v-col cols="12" sm="12" :md="isBackground ? 12 : 6" :lg="isBackground ? 12 : 6">
    <v-sheet
      class="scenario"
      :class="{ 'scenario--background': isBackground, 'scenario--dragged': draggedOver, 'scenario--pointer-frozen': shouldFreezePointer }"
      :color="mode === $modes.view ? '#f0f0f0' : $colors.lightSecondary"
      @dragenter.prevent="() => {}"
      @dragover.prevent="onDragOver"
      @dragleave="onDragLeave"
      @drop.prevent="onDrop"
    >
      <up-button
        v-if="canWrite && canMoveUp"
        class="scenario-up"
        @click="$emit('up')"
      />
      <down-button
        v-if="canWrite && canMoveDown"
        class="scenario-down"
        @click="$emit('down')"
      />
      <copy-button
        v-if="canWrite && !isBackground"
        class="scenario-copy"
        @click="$emit('copy')"
      />
      <edit-button
        v-if="canWrite && mode === $modes.view"
        class="scenario-edit"
        @click="switchToEditMode"
      />
      <view-button
        v-else-if="canWrite && mode === $modes.edit"
        class="scenario-edit"
        @click="switchToViewMode"
      />
      <delete-button
        v-if="canWrite"
        class="scenario-delete"
        @click="onDeleteClick"
      />
      <switch-scenario-type-chip
        v-if="shouldDisplayTypeSwitch"
        :value="scenario.type"
        :mode="mode"
        @input="onTypeChanged"
      />
      <tags-selector
        v-if="mode === $modes.edit"
        :project="project"
        :value="scenario.tags"
        @input="onTagsChanged"
      />
      <tags-list v-else :tags="scenario.tags" />
      <editable-subtitle
        v-if="mode === $modes.edit && !isBackground"
        label="Scenario title"
        :value="scenario.title"
        @input="onTitleChanged"
      />
      <h2 v-else>{{ scenario.title }}</h2>
      <step-list :mode="mode" :steps="scenario.steps" @input="onStepsChanged" />
      <examples-content
        v-if="scenario.examples"
        class="scenario-examples"
        :examples="scenario.examples"
        :mode="mode"
        @input="onExamplesChanged"
      />
      <create-table-step-param-dialog
        v-model="createTableStepParamDialog"
        @selected="onTableStepParamDimensionsSelected"
      />
    </v-sheet>
  </v-col>
</template>

<script lang="ts">
import Vue, { PropOptions } from 'vue'
import CopyButton from '~/components/buttons/CopyButton.vue'
import DeleteButton from '~/components/buttons/DeleteButton.vue'
import DownButton from '~/components/buttons/DownButton.vue'
import EditButton from '~/components/buttons/EditButton.vue'
import UpButton from '~/components/buttons/UpButton.vue'
import ViewButton from '~/components/buttons/ViewButton.vue'
import SwitchScenarioTypeChip from '~/components/chips/SwitchScenarioTypeChip.vue'
import CreateTableStepParamDialog from '~/components/dialogs/CreateTableStepParamDialog.vue'
import EditableSubtitle from '~/components/EditableSubtitle.vue'
import ExamplesContent from '~/components/ExamplesContent.vue'
import StepList from '~/components/StepList.vue'
import TagsList from '~/components/TagsList.vue'
import TagsSelector from '~/components/TagsSelector.vue'
import createScenarioStepFromStep from '~/helpers/createScenarioStepFromStep'
import {
  isInlineStepParam,
  Mode,
  Project,
  Scenario,
  ScenarioStep,
  ScenarioType,
  StepParamType,
  Tag,
} from '~/types'

interface Dimensions {
  width: number
  height: number
}

export default Vue.extend({
  components: {
    TagsList,
    TagsSelector,
    CreateTableStepParamDialog,
    CopyButton,
    DeleteButton,
    DownButton,
    EditButton,
    EditableSubtitle,
    ExamplesContent,
    StepList,
    SwitchScenarioTypeChip,
    UpButton,
    ViewButton,
  },
  model: {
    prop: 'scenario',
  },
  props: {
    canMoveUp: {
      type: Boolean,
      required: true,
    },
    canMoveDown: {
      type: Boolean,
      required: true,
    },
    backgroundable: {
      type: Boolean,
      required: true,
    },
    canWrite: {
      type: Boolean,
      required: true,
    },
    scenario: {
      type: Object,
      required: true,
    } as PropOptions<Scenario>,
    project: {
      type: Object,
      required: true,
    } as PropOptions<Project>,
  },
  data() {
    return {
      mode: Mode.View,
      draggedOver: false,
      createTableStepParamDialog: false,
      tableParamStepIndex: null as number | null,
    }
  },
  methods: {
    onDeleteClick(): void {
      this.$emit('deleted')
    },
    onDragOver(): void {
      this.draggedOver = !this.draggedOver ? this.$store.state.stepsDrawer.draggedStep !== null : true
    },
    onDragLeave(): void {
      this.draggedOver = false
    },
    onDrop(): void {
      const droppedStep = this.$store.state.stepsDrawer.draggedStep
      this.draggedOver = false

      if (null === droppedStep) {
        return
      }

      const steps = this.scenario.steps
      const step = createScenarioStepFromStep(steps, droppedStep)

      if (step.withTableParam) {
        const tableParamIndex = step.scenarioStep.params.findIndex(
          (s) => s.type === StepParamType.Table
        )

        if (tableParamIndex !== -1) {
          step.scenarioStep.params[tableParamIndex].content = []
          this.createTableStepParamDialog = true
          this.tableParamStepIndex = step.insertingIndex
        }
      }

      steps.splice(step.insertingIndex, 0, step.scenarioStep)
      this.onStepsChanged(steps)
    },
    onExamplesChanged(examples: Record<string, Array<string>>): void {
      this.$emit('input', {
        ...this.scenario,
        examples,
      })
    },
    onStepsChanged(steps: Array<ScenarioStep>): void {
      let examples = null
      let type = this.scenario.type

      if (this.scenario.type !== ScenarioType.Background) {
        examples = this.updateExamples(steps)
        type = examples ? ScenarioType.Outline : ScenarioType.Regular
      }

      this.$emit('input', {
        ...this.scenario,
        type,
        steps,
        examples,
      })
    },
    onTableStepParamDimensionsSelected(dimensions: Dimensions) {
      if (null === this.tableParamStepIndex) {
        return
      }

      const steps = [...this.scenario.steps]
      const params = [...steps[this.tableParamStepIndex].params]
      params[
        params.findIndex((p) => !isInlineStepParam(p))
      ].content = new Array(dimensions.height + 1)
        .fill(null)
        .map(() => new Array(dimensions.width + 1).fill(''))
      steps[this.tableParamStepIndex].params = params

      this.createTableStepParamDialog = false
      this.tableParamStepIndex = null

      this.onStepsChanged(steps)
    },
    onTagsChanged(tags: Array<Tag>): void {
      this.$emit('input', {
        ...this.scenario,
        tags,
      })
    },
    onTitleChanged(title: string): void {
      this.$emit('input', {
        ...this.scenario,
        title,
      })
    },
    onTypeChanged(type: string): void {
      this.$emit('input', {
        ...this.scenario,
        type: this.scenario.examples ? ScenarioType.Outline : type,
        title: type === ScenarioType.Background ? '' : 'Scenario title',
      })
    },
    updateExamples(
      steps: Array<ScenarioStep>
    ): Record<string, Array<string>> | null {
      const newExamples: Record<string, Array<string>> = {}
      const keys: Array<string> = []
      const re = new RegExp('<([^<>]+)>', 'g')

      steps.forEach((step: ScenarioStep) => {
        step.params.forEach((param) => {
          if (typeof param.content === 'string') {
            param.content.replace(re, function (): string {
              keys.push(arguments[1])

              return arguments[1]
            })
          } else {
            param.content.forEach((row) => {
              row.forEach((cell) => {
                cell.replace(re, function (): string {
                  keys.push(arguments[1])

                  return arguments[1]
                })
              })
            })
          }
        })
      })

      if (keys.length === 0) {
        return null
      }

      const currentValues = this.scenario.examples
        ? Object.values(this.scenario.examples)
        : []
      const newValuesLength =
        currentValues.length > 0 ? currentValues[0].length : 1
      keys.forEach((k) => {
        if (
          this.scenario.examples &&
          Object.keys(this.scenario.examples).indexOf(k) !== -1
        ) {
          newExamples[k] = this.scenario.examples[k]
          return
        }
        newExamples[k] = new Array(newValuesLength).fill('')
      })

      return newExamples
    },
    switchToEditMode() {
      this.mode = Mode.Edit
    },
    switchToViewMode() {
      this.mode = Mode.View
    },
  },
  computed: {
    isBackground(): boolean {
      return (this as any).scenario.type === ScenarioType.Background
    },
    shouldDisplayTypeSwitch(): boolean {
      return (
        ((this as any).scenario.examples === undefined ||
          (this as any).scenario.examples === null) &&
        (this as any).backgroundable &&
        (this.mode === Mode.Edit ||
          this.scenario.type === ScenarioType.Background)
      )
    },
    shouldFreezePointer(): boolean {
      return (this as any).$store.state.stepsDrawer.draggedStep !== null
    }
  },
})
</script>

<style scoped>
.scenario {
  padding: 1rem;
  margin: 2rem 0;
  width: 100%;
  height: 100%;
  position: relative;
}

.scenario.scenario--background {
  background-color: #dadada !important;
}

.scenario.scenario--dragged, .scenario.scenario--background.scenario.scenario--dragged {
  background-color: #a4b0be !important;
}

.scenario.scenario--pointer-frozen * {
  pointer-events: none;
}

.scenario .scenario-up {
  position: absolute;
  left: 96px;
  top: -16px;
}

.scenario .scenario-down {
  position: absolute;
  left: 144px;
  top: -16px;
}

.scenario .scenario-copy {
  position: absolute;
  left: 48px;
  top: -16px;
}

.scenario .scenario-edit {
  position: absolute;
  left: 0;
  top: -16px;
}

.scenario .scenario-delete {
  position: absolute;
  left: 192px;
  top: -16px;
}

.scenario .scenario-examples {
  margin-top: 2rem;
}
</style>
