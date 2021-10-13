import React from 'react'
import './App.css'

// Import the Slate editor factory.
import { createEditor, Editor, BaseText, Text, Node, Transforms, BaseEditor } from 'slate'

// Import the Slate components and React plugin.
import { ReactEditor, Slate, Editable, withReact } from 'slate-react'

type CustomElement = {
  type: 'paragraph' | 'code'
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

const initialValue: CustomElement[] = [
  {
    type: 'paragraph',
    children: [
      {
        text: 'A line of text in a paragraph.'
      },
    ],
  },
]

const CustomEditor = {
  isBoldMarkActive(editor: CustomEditor) {
    const [match] = Editor.nodes(editor, {
      match: n => (n as CustomText).bold === true,
      universal: true,
    })

    return Boolean(match)
  },

  isCodeBlockActive(editor: CustomEditor) {
    const [match] = Editor.nodes(editor, {
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
      { match: n => Editor.isBlock(editor, n) }
    )
  },
}


const App: React.FC = () => {
  const [value, setValue] = React.useState<CustomElement[]>(initialValue)
  const editor = React.useMemo(() => withReact(createEditor() as ReactEditor), [])

  return (
    <div className="app">
      <header>
        <h1>Slate@Next Tester 01</h1>
      </header>
      <main>
        <Slate
          editor={editor}
          value={value}
          onChange={value => {
            setValue(value as CustomElement[])
            const isAstChange = editor.operations.some(
              op => 'set_selection' !== op.type
            )
            if (isAstChange) {
              // Save the value to Local Storage.
              const content = JSON.stringify(value)
              localStorage.setItem('content', content)
              localStorage.setItem('serializedContent', serialize(value as CustomElement[]))
            }
          }}
        >
          <div>
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

const DefaultElement: React.FC<any> = props => {
  return <p {...props.attributes}>{props.children}</p>
}

const renderElement = (props: any) => {
  switch (props.element.type) {
    case 'code':
      return <CodeElement {...props} />
    default:
      return <DefaultElement {...props} />
  }
}

// Define a React component to render leaves with bold text.
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

// Define a leaf rendering function that is memoized with `useCallback`.
const renderLeaf = (props: any) => {
  return <Leaf {...props} />
}

export default App
