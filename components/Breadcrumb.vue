<template>
  <div
    class="breadcrumb"
    :style="`border-bottom: 1px solid ${$colors.primary}`"
  >
    <v-breadcrumbs :items="items">
      <template v-slot:divider>
        <v-icon>mdi-chevron-right</v-icon>
      </template>
      <template v-slot:item="{ item }">
        <v-breadcrumbs-item :href="item.href" :nuxt="true">{{ item.text }}</v-breadcrumbs-item>
      </template>
    </v-breadcrumbs>
  </div>
</template>

<script lang="ts">
import Vue, { PropOptions } from 'vue'
import { Breadcrumb } from '~/types'

export default Vue.extend({
  props: {
    items: {
      type: Array,
      required: true,
    } as PropOptions<Breadcrumb>,
  },
})
</script>

<style scoped>
.breadcrumb {
  margin-bottom: 1rem;
}
</style>
