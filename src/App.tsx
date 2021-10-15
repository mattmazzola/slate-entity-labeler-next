import React from 'react'
import './App.css'

// Import the Slate editor factory.
import { createEditor, Editor, BaseText, Text, Node, Transforms, BaseEditor } from 'slate'

// Import the Slate components and React plugin.
import { ReactEditor, Slate, Editable, withReact, DefaultElement } from 'slate-react'

type CustomElement = {
  type: 'paragraph' | 'code' | 'entity'
  children: CustomText[]
}

type CustomText = BaseText & {
  bold?: boolean
}

type CustomEditor = ReactEditor & BaseEditor

declare module 'slate' {
  interface CustomTypes {
    Editor: CustomEditor
    Element: CustomElement
    Text: CustomText
  }
}

// Define a serializing function that takes a value and returns a string.
const serialize = (value: CustomElement[]) => {
  return (
    value
      // Return the string content of each paragraph in the value's children.
      .map(n => Node.string(n))
      // Join them all with line breaks denoting paragraphs.
      .join('\n')
  )
}

// Define a deserializing function that takes a string and returns a value.
const deserialize = (value: string) => {
  // Return a value array of children derived by splitting the string.
  return value.split('\n')
    .map(line => {
      return {
        children: [{ text: line }],
      }
    })
}

const slatejsContentKey = 'slatejs-content-key'

const isInline = (element: CustomElement) => {
  let inline = false

  switch (element.type) {
    case 'entity': {
      inline = true
    }
  }

  return inline
}


const defaultValue: CustomElement[] = [
  {
    type: 'paragraph',
    children: [
      {
        text: 'A line of text in a paragraph.'
      },
    ],
  },
]

const storedContent = localStorage.getItem(slatejsContentKey)
const initialValue: CustomElement[] = storedContent
  ? JSON.parse(storedContent)
  : defaultValue

const CustomEditor = {
  ...Editor,

  isBoldMarkActive(editor: CustomEditor) {
    const [match] = CustomEditor.nodes(editor, {
      match: n => (n as CustomText).bold === true,
      universal: true,
    })

    return Boolean(match)
  },

  isCodeBlockActive(editor: CustomEditor) {
    const [match] = CustomEditor.nodes(editor, {
      match: n => (n as CustomElement).type === 'code',
    })

    return Boolean(match)
  },


  toggleBoldMark(editor: CustomEditor) {
    const isActive = CustomEditor.isBoldMarkActive(editor)
    Transforms.setNodes(
      editor,
      { bold: isActive ? null : true } as CustomText,
      { match: n => Text.isText(n), split: true }
    )
  },

  toggleCodeBlock(editor: CustomEditor) {
    const isActive = CustomEditor.isCodeBlockActive(editor)
    Transforms.setNodes(
      editor,
      { type: isActive ? null : 'code' } as CustomElement,
      { match: n => CustomEditor.isBlock(editor, n) }
    )
  },

  isEntity(editor: CustomEditor) {
    const [match] = CustomEditor.nodes(editor, {
      match: n => (n as CustomElement).type === 'entity',
    })

    return Boolean(match)
  },

  toggleBlockEntity(editor: CustomEditor) {
    const isEntity = CustomEditor.isEntity(editor)

    Transforms.setNodes(
      editor,
      { type: isEntity ? null : 'entity' } as CustomElement,
      { match: n => Text.isText(n), split: true }
    )
  },

  toggleInlineEntity(editor: CustomEditor) {
    const isEntity = CustomEditor.isEntity(editor)

    Transforms.setNodes(
      editor,
      { type: isEntity ? null : 'entity' } as CustomElement,
      { match: n => Text.isText(n), split: true }
    )
  }
}

const withLabels = (editor: CustomEditor) => {
  const { isInline } = editor

  editor.isInline = (element: CustomElement) => {
    switch (element.type) {
      case 'entity': {
        return true
      }
    }

    return isInline(element)
  }

  return editor
}

const debounce = <T extends (...args: any[]) => any>(fn: T, time: number) => {
  let timeoutId: NodeJS.Timeout

  const debouncedFn = (...args: Parameters<T>) => {
    if (timeoutId) {
      clearTimeout(timeoutId)
    }

    timeoutId = setTimeout(() => {
      fn(...args)
    }, time)
  }

  return debouncedFn
}

const saveValue = (value: CustomElement[]) => {
  // Save the value to Local Storage.
  const content = JSON.stringify(value)
  localStorage.setItem(slatejsContentKey, content)
  localStorage.setItem('serializedContent', serialize(value as CustomElement[]))
}

const debouncedSaveValue = debounce(saveValue, 500)
  
const App: React.FC = () => {
  const [value, setValue] = React.useState<CustomElement[]>(initialValue)
  const editor = React.useMemo(() => withLabels(withReact(createEditor())), [])

  return (
    <div className="app">
      <header>
        <h1>Slate@Next Tester 01</h1>
      </header>
      <main>
        <h2>Editor</h2>
        <section>
          <Slate
            editor={editor}
            value={value}
            onChange={value => {
              setValue(value as CustomElement[])
              const isAstChange = editor.operations.some(
                op => 'set_selection' !== op.type
              )
              if (isAstChange) {
                debouncedSaveValue(value as CustomElement[])
              }
            }}
          >
            <div>
              <button
                onMouseDown={event => {
                  event.preventDefault()
                  setValue(defaultValue)
                }}
              >
                Reset
              </button>
              <button
                onMouseDown={event => {
                  event.preventDefault()
                  CustomEditor.toggleBoldMark(editor)
                }}
              >
                Bold
              </button>
              <button
                onMouseDown={event => {
                  event.preventDefault()
                  CustomEditor.toggleCodeBlock(editor)
                }}
              >
                Code Block
              </button>
              <button
                onMouseDown={event => {
                  event.preventDefault()
                  CustomEditor.toggleBlockEntity(editor)
                }}
              >
                Create Block Entity
              </button>
              <button
                onMouseDown={event => {
                  event.preventDefault()
                  CustomEditor.toggleInlineEntity(editor)
                }}
              >
                Create Inline Entity
              </button>
            </div>
            <Editable
              renderElement={renderElement}
              renderLeaf={renderLeaf}
              onKeyDown={event => {
                if (event.key === '&') {
                  // Prevent the ampersand character from being inserted.
                  event.preventDefault()
                  // Execute the `insertText` method when the event occurs.
                  editor.insertText('and')
                }

                if (!event.ctrlKey) {
                  return
                }

                switch (event.key) {
                  case '`': {
                    event.preventDefault()
                    CustomEditor.toggleCodeBlock(editor)
                    break
                  }
                  case 'b': {
                    event.preventDefault()
                    CustomEditor.toggleBoldMark(editor)
                    break
                  }
                }
              }}
            />
          </Slate>
        </section>
        <section>
          <h2>Slate Value:</h2>
          <div className="code-container">
            <pre>
              <code>{JSON.stringify(value, null, 4)}</code>
            </pre>
          </div>
        </section>
      </main>
    </div>
  )
}

const CodeElement: React.FC<any> = props => {
  return (
    <pre {...props.attributes}>
      <code>{props.children}</code>
    </pre>
  )
}

const EntityElement: React.FC<any> = props => {
  return (
    <div {...props.attributes}>
      {props.children}
    </div>
  )
}

const renderElement = (props: any) => {
  switch (props.element.type) {
    case 'code':
      return <CodeElement {...props} />
    case 'entity':
      return <EntityElement {...props} />
    default:
      return <DefaultElement {...props} />
  }
}

const Leaf: React.FC<any> = props => {
  return (
    <span
      {...props.attributes}
      style={{ fontWeight: props.leaf.bold ? 'bold' : 'normal' }}
    >
      {props.children}
    </span>
  )
}

const renderLeaf = (props: any) => {
  return <Leaf {...props} />
}

export default App
