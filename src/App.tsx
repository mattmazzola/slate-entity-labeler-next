import React from 'react'
import styled from 'styled-components'
import EntityLabeler, { CustomElement, LabeledEntity, LabelMode, EntityData, Entity, LabeledText } from './components/EntityLabeler'
import SliderOptions from './components/SliderOptions'

const defaultText = `
OK test this
Fourth word second word
Third line, let's test this
`.trim()

const defaultLabeledText: LabeledText<EntityData> = {
  text: defaultText,
  entities: []
}

const defaultOptions = `
apples
oranges
pears
blueberries
pickles
cucumbers
olives
rasberries
watermelons
plums
`.trim()

const App: React.FC = () => {
  const [labeledText, setLabeledText] = React.useState<LabeledText<EntityData>>(defaultLabeledText)
  const [labelMode, setLabelMode] = React.useState<LabelMode>(LabelMode.EditText)
  const [value, setValue] = React.useState<CustomElement[] | undefined>()
  const [optionString, setOptionsString] = React.useState(defaultOptions)

  const onChangeValue = (value: CustomElement[]) => {
    setValue(value)
  }

  const onChangeLabeledText = (labeledText: LabeledText<EntityData>) => {
    setLabeledText(labeledText)
  }

  const onChangeSelectedOption = (option: string) => {
    setLabelMode(option as LabelMode)
  }

  const onChangeOptionsString: React.ChangeEventHandler<HTMLTextAreaElement> = event => {
    setOptionsString(event.target.value)
  }

  const labelModeOptions = [
    {
      name: `1: Edit`,
      value: LabelMode.EditText
    },
    {
      name: '2: Label',
      value: LabelMode.Label
    }
  ]

  const entities = optionString.split('\n')
    .filter(o => o.length > 0)
    .map<Entity>((o, i) => {
      return {
        name: o,
        id: `${o.toLowerCase()}-${i}`
      }
    })

  return (
    <Wrapper>
      <header>
        <h1>Slate Entity Labeler</h1>
      </header>
      <main>
        <section>
          <h2>Options</h2>
          <EntityTextarea value={optionString} onChange={onChangeOptionsString} rows={5} />
        </section>
        <section>
          <SliderOptions
            options={labelModeOptions}
            selectedOption={labelMode}
            onChangeSelectedOption={onChangeSelectedOption}
          />
          <EntityLabeler
            labeledText={labeledText}
            labelMode={labelMode}
            entities={entities}
            onChangeValue={onChangeValue}
            onChangeLabeledText={onChangeLabeledText}
          />
        </section>
        <DataSection>
          <div>
            <div>
              <h2>Text</h2>
              {labeledText.text}
            </div>
            <div>
              <h2>Entities:</h2>
              <CodeContainer>
                <pre>
                  <code>{labeledText.entities ? JSON.stringify(labeledText.entities, null, 4) : "Empty"}</code>
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

const EntityTextarea = styled.textarea`
  border-radius: 3px;
  border: 1px solid var(--color-gray-300);
  padding: 0.25rem;
  font-size: 1rem;
  font: var(--font-family-sans-serif);
  background: transparent;
  color: var(--color-gray-100);
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
