import React from 'react'
import styled from 'styled-components'
import EntityLabeler, { CustomElement } from './components/EntityLabeler'

const App: React.FC = () => {
  const [value, setValue] = React.useState<CustomElement[] | undefined>()

  return (
    <Wrapper>
      <header>
        <h1>Slate@Next</h1>
      </header>
      <main>
        <h2>Entity Labeler</h2>
        <section>
          <EntityLabeler onChange={value => setValue(value)}/>
        </section>
        <section>
          <h2>Slate Value:</h2>
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
