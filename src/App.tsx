import React from 'react'
import './App.css'
import EntityLabeler, { CustomElement } from './components/EntityLabeler'

const App: React.FC = () => {
  const [value, setValue] = React.useState<CustomElement[] | undefined>()

  return (
    <div className="app">
      <header>
        <h1>Slate@Next Tester 01</h1>
      </header>
      <main>
        <h2>Editor</h2>
        <section>
          <EntityLabeler onChange={value => setValue(value)}/>
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

export default App
