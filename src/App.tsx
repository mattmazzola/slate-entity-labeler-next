import React from 'react'
import styled from 'styled-components'
import EntityLabeler, { CustomElement, IEntity, DebugMode, LabelMode, EntityData } from './components/EntityLabeler'
import SliderOptions from './components/SliderOptions'

const defaultText = `
OK test this
Fourth word second word
Third line, let's test this
`.trim()



const App: React.FC = () => {
  const [text, setText] = React.useState<string>(defaultText)
  const [labelMode, setLabelMode] = React.useState<LabelMode>(LabelMode.EditText)
  const [debugMode, setDebugMode] = React.useState<DebugMode>(DebugMode.Debug)
  const [entities, setEntities] = React.useState<IEntity<EntityData>[]>([])
  const [value, setValue] = React.useState<CustomElement[] | undefined>()

  const onChangeValue = (value: CustomElement[]) => {
    setValue(value)
  }

  const onChangeText = (text: string) => {
    setText(text)
  }

  const onChangeEntities = (entities: IEntity<EntityData>[]) => {
    setEntities(entities)
  }

  const onChangeSelectedOption = (option: string) => {
    setLabelMode(option as LabelMode)
  }

  const onChangeDebugSelectedOption = (option: string) => {
    setDebugMode(option as DebugMode)
  }

  return (
    <Wrapper>
      <header>
        <h1>Slate Entity Labeler</h1>
      </header>
      <main>
        <div>
          <SliderOptions
            options={[LabelMode.EditText, LabelMode.Label]}
            selectedOption={labelMode}
            onChangeSelectedOption={onChangeSelectedOption}
          />
        </div>

        <section>
          <h2>Editor</h2>
          <EntityLabeler
            text={text}
            labelMode={labelMode}
            entities={entities}
            onChangeValue={onChangeValue}
            onChangeText={onChangeText}
            onChangeEntities={onChangeEntities}
          />
        </section>
        <DataSection>
          <div>
            <div>
              <h2>Text</h2>
              {text}
            </div>
            <div>
              <h2>Entities:</h2>
              <CodeContainer>
                <pre>
                  <code>{entities ? JSON.stringify(entities, null, 4) : "Empty"}</code>
                </pre>
              </CodeContainer>
            </div>
          </div>

          <ValueDiv>
            <h2>Value:</h2>
            <CodeContainer>
              <pre>
                <code>{value ? JSON.stringify(value, null, 4) : "Empty"}</code>
              </pre>
            </CodeContainer>
          </ValueDiv>
        </DataSection>
      </main>
    </Wrapper>
  )
}

const Wrapper = styled.div`
  padding: 2rem;
  font-size: 2rem;
  position: relative;
`

const DataSection = styled.section`
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 2rem;
`

const ValueDiv = styled.div`
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
