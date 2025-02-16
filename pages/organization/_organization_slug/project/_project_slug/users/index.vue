<template>
  <v-main>
    <breadcrumb :items="breadcrumbItems" />
    <h1>Project "{{ project.title }}" users</h1>
    <users-table
      :users="users"
      mode="project"
      :search-users-within-organization="true"
      @add="onUserAdd"
      @delete="onUserDelete"
      @change="onUserChanged"
    />
    <v-snackbar
      v-model="addSuccessSnackbarOpened"
      :color="$colors.success"
    >
      User added
    </v-snackbar>
    <v-snackbar
      v-model="deleteSuccessSnackbarOpened"
      :color="$colors.success"
    >
      User removed
    </v-snackbar>
    <v-snackbar
      v-model="updateSuccessSnackbarOpened"
      :color="$colors.success"
    >
      User updated
    </v-snackbar>
    <v-snackbar
      v-model="addErrorSnackbarOpened"
      :color="$colors.error"
    >
      An error occurred while updating the user
    </v-snackbar>
    <v-snackbar
      v-model="addConflictErrorSnackbarOpened"
      :color="$colors.error"
    >
      The user is already in this project
    </v-snackbar>
    <v-snackbar
      v-model="deleteErrorSnackbarOpened"
      :color="$colors.error"
    >
      An error occurred while removing the user
    </v-snackbar>
    <v-snackbar
      v-model="updateErrorSnackbarOpened"
      :color="$colors.error"
    >
      An error occurred while updating the user
    </v-snackbar>
  </v-main>
</template>

<script lang="ts">
import Vue from 'vue'
import Breadcrumb from '~/components/Breadcrumb.vue';
import UsersTable from '~/components/UsersTable.vue'
import {
  BaseUser,
  Breadcrumb as BreadcrumbType,
  Project,
  ProjectUser,
  ProjectUserList,
} from '~/types'

interface InitialData {
  users: ProjectUserList
  project: Project
}

export default Vue.extend({
  auth: true,
  components: {
    Breadcrumb,
    UsersTable,
  },
  head() {
    return {
      title: (this as any).getPageTitle()
    }
  },
  async asyncData({ $api, params }): Promise<InitialData> {
    const [users, project]: [ProjectUserList, Project] = await Promise.all([
      $api.getProjectUsers(params.project_slug, params.organization_slug),
      $api.getProject(params.project_slug, params.organization_slug),
    ])

    return {
      users,
      project,
    }
  },
  data: function () {
    return {
      users: [] as ProjectUserList,
      project: {} as Project,
      addSuccessSnackbarOpened: false,
      addConflictErrorSnackbarOpened: false,
      addErrorSnackbarOpened: false,
      deleteSuccessSnackbarOpened: false,
      deleteErrorSnackbarOpened: false,
      updateSuccessSnackbarOpened: false,
      updateErrorSnackbarOpened: false,
    }
  },
  methods: {
    onUserAdd: async function (user: BaseUser) {
      try {
        await this.$api.createProjectUser(this.project, user, this.$axios)
        this.addSuccessSnackbarOpened = true
        await this.reload()
      } catch (error) {
        if (error.response.status === 409) {
          this.addConflictErrorSnackbarOpened = true
        } else {
          this.addErrorSnackbarOpened = true
        }
      }
    },
    onUserDelete: async function (user: ProjectUser) {
      try {
        await this.$api.deleteProjectUser(
          this.project.id,
          user.user.id,
          this.$axios
        )
        this.deleteSuccessSnackbarOpened = true
        await this.reload()
      } catch (error) {
        this.deleteErrorSnackbarOpened = true
      }
    },
    onUserChanged: async function (user: ProjectUser) {
      try {
        await this.$api.updateProjectUser(
          this.project.id,
          user.user.id,
          user.permissions,
          this.$axios
        )
        this.updateSuccessSnackbarOpened = true
        await this.reload()
      } catch (e) {
        this.updateErrorSnackbarOpened = true
      }
    },
    reload: async function () {
      const params = this.$route.params

      this.users = await this.$api.getProjectUsers(
        params.project_slug,
        params.organization_slug,
        this.$axios
      )
    },
    getPageTitle(): string {
      if ((this as any).$data.project.organization) {
        return `Users - ${(this as any).$data.project.title} - ${(this as any).$data.project.organization.name} | Dentest`;
      }

      return `Users - ${(this as any).$data.project.title} | Dentest`;
    },
  },
  computed: {
    breadcrumbItems(): BreadcrumbType {
      const out = [] as BreadcrumbType
      let project = (this as any).project

      if (project.organization) {
        out.push({
          text: project.organization.name,
          href: (this as any).$routes.organization(project.organization.slug),
          disabled: false,
        })
      }
      out.push({
        text: project.title,
        href: (this as any).$routes.project(project),
        disabled: false,
      })
      out.push({
        text: 'Users',
        href: '',
        disabled: true,
      })

      return out
    },
  },
})
</script>
