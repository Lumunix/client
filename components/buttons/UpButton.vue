<template>
  <v-btn
    @click="(e) => $emit('click', e)"
    :color="$colors.quaternary"
    elevation="0"
    fab
    dark
    x-small
    title="Move up"
  >
    <v-icon>mdi-arrow-up</v-icon>
  </v-btn>
</template>
