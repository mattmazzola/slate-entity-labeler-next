import React from 'react'
import styled from 'styled-components'

type Props = {
    options: string[]
    onClickCreate: (entityId: string, entityName: string) => void
}

export const EntityPicker: React.FC<Props> = (props) => {
    const randomValue = Math.floor(Math.random() * 10000)
    const entityId = `entityId-${randomValue}`
    const entityName = `entityName-${randomValue}`

    return (
        <Wrapper>
            <div>
                Entity
            </div>
            <button onClick={() => props.onClickCreate(entityId, entityName)}>Create Entity</button>
            <div>
                {props.options.map(option => {
                    return (
                        <div>{option}</div>
                    )
                })}
            </div>
        </Wrapper>
    )
}

const Wrapper = styled.div`
    position: absolute;
    top: 50px;
    background: white;
    color: black;
    font-size: 1rem;
    border-radius: 5px;
    width: 120px;
    z-index: 1;
    padding: 0.5rem;
`

