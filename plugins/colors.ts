import Vue from 'vue'

declare module 'vue/types/vue' {
  interface Vue {
    $colors: Colors
  }
}

interface Colors {
  primary: string,
  secondary: string,
  add: string,
  success: string,
  error: string,
  lightPrimary: string,
  cancel: string
}

// palette: https://flatuicolors.com/palette/au
Vue.prototype.$colors = {
  primary: '#686de0',
  secondary: '#f0932b',
  add: '#4834d4',
  success: '#6ab04c',
  error: '#eb4d4b',
  lightPrimary: '#E2E7FF',
  cancel: '#777777'
} as Colors;
