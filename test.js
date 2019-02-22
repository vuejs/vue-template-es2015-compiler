const transpile = require('./index')
const Vue = require('vue')
const { compile } = require('vue-template-compiler')

const toFunction = code => {
  code = transpile(`function render(){${code}}`)
  code = code.replace(/function render\(\)\{|\}$/g, '')
  return new Function(code)
}

const compileAsFunctions = template => {
  const { render, staticRenderFns } = compile(template)
  return {
    render: toFunction(render),
    staticRenderFns: staticRenderFns.map(toFunction)
  }
}

test('should work', () => {
  const vm = new Vue({
    ...compileAsFunctions(`
      <div>
        <div>{{ foo }}</div>
        <div v-for="{ name } in items">{{ name }}</div>
        <div v-bind="{ ...a, ...b }"/>
      </div>
    `),
    data: {
      foo: 'hello',
      items: [
        { name: 'foo' },
        { name: 'bar' }
      ],
      a: { id: 'foo' },
      b: { class: 'bar' }
    }
  }).$mount()

  expect(vm.$el.innerHTML).toMatch(
    `<div>hello</div> ` +
    `<div>foo</div><div>bar</div> ` +
    `<div id="foo" class="bar"></div>`
  )
})

test('arg spread', () => {
  const res = compile(`
    <button @click="(...args) => { store.foo(...args) }">Go</button>
  `)
  const code = transpile(`function render() {${res.render}}`)
  expect(code).toMatch(`_vm.store.foo.apply(_vm.store, args)`)
})

test('rest spread in scope position', () => {
  const vm = new Vue({
    ...compileAsFunctions(`
      <foo v-slot="{ foo, ...rest }">{{ rest }}</foo>
    `),
    components: {
      foo: {
        render(h) {
          return h('div', this.$scopedSlots.default({
            foo: 1,
            bar: 2,
            baz: 3
          }))
        }
      }
    }
  }).$mount()

  expect(vm.$el.innerHTML).toMatch(
    JSON.stringify({ bar: 2, baz: 3 }, null, 2)
  )
})

test('trailing function comma', () => {
  const spy = jest.fn()
  const vm = new Vue({
    ...compileAsFunctions(`
      <button @click="spy(1,)" />
    `),
    methods: {
      spy
    }
  }).$mount()
  vm.$el.click()
  expect(spy).toHaveBeenCalled()
})

test('v-model code', () => {
  const vm = new Vue({
    ...compileAsFunctions(`
      <input v-model="text" />
    `),
    data: {
      text: 'foo'
    }
  }).$mount()
})
