import '../css/style.scss'
import App from './App.svelte'

const init = () => {
  new App({
    target: document.body
  })
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init)
} else {
  init()
}
