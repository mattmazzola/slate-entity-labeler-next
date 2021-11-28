import React from 'react'
import styled from 'styled-components'
import EntityLabeler, { CustomElement, LabelMode, EntityData, Entity, LabeledText } from './components/EntityLabeler'
import SliderOptions from './components/SliderOptions'
import { v4 as uuid } from 'uuid'

const defaultText = `
OK test this
Fourth word second word
Third line, let's test this
`.trim()



const defaultOptions = `
apples
oranges
pears
blueberries
pickles
cucumbers
olives
raspberries
watermelons
plums
`.trim()

const defaultEntities = defaultOptions.split('\n')
  .filter(o => o.length > 0)
  .map<Entity>((o, i) => {
    return {
      name: o,
      id: uuid()
    }
  })

const App: React.FC = () => {
  const [entities, setEntities] = React.useState(defaultEntities)
  const [labeledText, setLabeledText] = React.useState<LabeledText<EntityData>>(() => {
    const firstEntity = entities[0]
    return {
      text: defaultText,
      entities: [
        {
          id: firstEntity.id,
          startTokenIndex: 2,
          tokenLength: 1,
          data: {
            name: firstEntity.name,
            text: "text this"
          }
        }
      ]
    }
  })

  const [labelMode, setLabelMode] = React.useState<LabelMode>(() => {
    return labeledText.entities.length > 0
      ? LabelMode.Label
      : LabelMode.EditText
  })
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


  React.useEffect(() => {
    const newEntities = optionString.split('\n')
      .filter(o => o.length > 0)
      .map<Entity>((o, i) => {
        return {
          name: o,
          id: uuid()
        }
      })

    setEntities(newEntities)
  }, [optionString])

  return (
    <Wrapper>
      <Header>
        <h1>Slate Entity Labeler</h1>
      </Header>
      <main>
        <ComponentSection>
          <Column>
            <h2>Options:</h2>
            <EntityTextarea value={optionString} onChange={onChangeOptionsString} rows={5} />
          </Column>
          <Column>
            <h2>Labeler:</h2>
            <EntityLabeler
              labeledText={labeledText}
              labelMode={labelMode}
              entities={entities}
              onChangeValue={onChangeValue}
              onChangeLabeledText={onChangeLabeledText}
            />
            <SliderOptions
              options={labelModeOptions}
              selectedOption={labelMode}
              onChangeSelectedOption={onChangeSelectedOption}
            />
          </Column>
        </ComponentSection>

        <DataSection>
          <div>
            <div>
              <h2>Labeled Text Value:</h2>
              <CodeContainer>
                <pre>
                  <code>{labeledText ? JSON.stringify(labeledText, null, 4) : "Empty"}</code>
                </pre>
              </CodeContainer>
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
            <h2>Slate Value:</h2>
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

const Header = styled.header`
  text-align: center;
`

const ComponentSection = styled.section`
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 2rem;
`

const Column = styled.div`
  display: flex;
  flex-direction: column;
  gap: 1rem;
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
  resize: none;
`

const CodeContainer = styled.div`
  border-radius: 4px;
  border: 1px solid var(--color-white);
  font-size: 1rem;
  padding: 0.25em;

  & pre {
    margin: 0;
    padding: 0;
  }
`

export default App
