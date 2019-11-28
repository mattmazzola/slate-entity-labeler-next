import React from 'react'
import './App.css'
// Import the Slate editor factory.
import { createEditor, Editor, Node } from 'slate'

// Import the Slate components and React plugin.
import { Slate, Editable, withReact } from 'slate-react'
import { CustomMarkProps } from 'slate-react/lib/components/custom'

type SlateValue = any[]

const defaultValue = [
  {
    type: 'paragraph',
    children: [
      {
        text: 'A line of text in a paragraph.',
        marks: [],
      },
    ],
  },
]

// Define a serializing function that takes a value and returns a string.
const serialize = (value: SlateValue) => {
  return (
    value
      // Return the text content of each paragraph in the value's children.
      .map(n => Node.text(n))
      // Join them all with line breaks denoting paragraphs.
      .join('\n')
  )
}

const App: React.FC = () => {
  const editor = React.useMemo(() => withReact(createEditor()), [])

  // Define a rendering function based on the element passed to `props`. We use
  // `useCallback` here to memoize the function for subsequent renders.
  const renderElement = React.useCallback(props => {
    switch (props.element.type) {
      case 'code':
        return <CodeElement {...props} />
      default:
        return <DefaultElement {...props} />
    }
  }, [])

const renderMark = React.useCallback((props: CustomMarkProps) => {
  switch (props.mark.type) {
    case 'bold': {
      return <BoldMark {...props} />
    }
    default:
      return <span {...props} />
  }
}, [])

  return (
    <div className="app">
      <header>
        Slate@Next Tester 01
      </header>
      <main>
        <Slate
          editor={editor}
          defaultValue={defaultValue}
          onChange={(value: SlateValue) => {
            const slateValue = JSON.stringify(value, null, '  ')
            const serializedValue = serialize(value)

            console.log(slateValue)
            console.log(serializedValue)
          }}
        >
          <Editable
            renderElement={renderElement}
            renderMark={renderMark}
            onKeyDown={(event: any) => {
              if (!event.ctrlKey) {
                return
              }

              // When "`" is pressed, keep our existing code block logic.
              switch (event.key) {
                case '`': {
                  event.preventDefault()
                  const { selection } = editor
                  const isCode = selection
                    ? Editor.match(editor, selection, { type: 'code' })
                    : false

                  Editor.setNodes(
                    editor,
                    { type: isCode ? null : 'code' },
                    { match: 'block' }
                  )
                  break
                }

                // When "B" is pressed, add a bold mark to the text.
                case 'b': {
                  event.preventDefault()
                  Editor.addMarks(editor, [{ type: 'bold' }])
                  break
                }
              }
            }}
            onDOMBeforeInput={() => { }}

          />
        </Slate>

        asdf
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

const BoldMark: React.FC<any> = props => {
  return <strong {...props.attributes}>{props.children}</strong>
}

export default App
