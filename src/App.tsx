import React from 'react'
import styled from 'styled-components'
import EntityLabeler, { CustomElement, IEntity, DebugMode, LabelMode } from './components/EntityLabeler'

const defaultText = `OK test this`.trim()

const App: React.FC = () => {
  const [text, setText] = React.useState<string>(defaultText)
  const [labelMode, setLabelMode] = React.useState<LabelMode>(LabelMode.EditText)
  const [debugMode, setDebugMode] = React.useState<DebugMode>(DebugMode.Debug)
  const [entities, setEntities] = React.useState<IEntity<unknown>[]>([])
  const [value, setValue] = React.useState<CustomElement[] | undefined>()
  const onToggleMode = () => {
    setDebugMode(m => {
      return m === DebugMode.Debug
        ? DebugMode.Normal
        : DebugMode.Debug
    })
  }

  return (
    <Wrapper>
      <header>
        <h1>Slate Entity Labeler</h1>
      </header>
      <main>
        <h2>Editor</h2>
        <div>
          Label Mode: {labelMode}
          <div>
            <button onClick={() => setLabelMode(LabelMode.EditText)}>Edit Text</button>
            <button onClick={() => setLabelMode(LabelMode.Label)}>Label Entities</button>
          </div>
        </div>
        <div>
          Debug Mode: {debugMode}
          <div>
            <button onClick={onToggleMode}>Toggle Mode</button>
          </div>
        </div>
        <section>
          <EntityLabeler
            text={text}
            labelMode={labelMode}
            debugMode={debugMode}
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
