import React from 'react'
import styled from 'styled-components'
import EntityLabeler, { CustomElement, IEntity } from './components/EntityLabeler'

const defaultText = `
This is the first line of text
This is the second line of text
This is the third line of text
`.trim()

const App: React.FC = () => {
  const [text, setText] = React.useState<string>(defaultText)
  const [entities, setEntities] = React.useState<IEntity<unknown>[]>([])
  const [value, setValue] = React.useState<CustomElement[] | undefined>()

  return (
    <Wrapper>
      <header>
        <h1>Slate Entity Labeler</h1>
      </header>
      <main>
        <h2>Editor</h2>
        <section>
          <EntityLabeler
            text={text}
            entities={entities}
            onChangeValue={value => setValue(value)}
          />
        </section>
        <section>
          <h2>Value:</h2>
          <CodeContainer>
            <pre>
              <code>{value ? JSON.stringify(value, null, 4) : "Empty"}</code>
            </pre>
          </CodeContainer>
        </section>
      </main>
    </Wrapper>
  )
}

const Wrapper = styled.div`
  padding: 2rem;
  font-size: 2rem;
  position: relative;
`

const CodeContainer = styled.div`
  border-radius: 3px;
  border: 1px solid var(--color-white);
  font-size: 1rem;

  & pre {
    margin: 0;
    padding: 0;
  }
`

export default App
