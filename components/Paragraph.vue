<template>
  <div>
    <div v-for="(line, i) in lines" :key="i">{{ line }}</div>
  </div>
</template>

<script lang="ts">
import Vue from 'vue'

export default Vue.extend({
  props: {
    str: {
      type: String,
      required: true,
    },
  },
  computed: {
    lines(): Array<string> {
      return (this as any).str.split('\n')
    },
  },
})
</script>
