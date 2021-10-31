/**
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

import React from 'react'
import styled from 'styled-components'
import { MatchedString } from './models'

type Props = {
    matches: MatchedString[]
}

/**
 * Display Fuse.io search match with characters from search input having custom style such as highlight or bold
 */
const FuseMatch: React.FC<Props> = props => {
    return <span>
        {props.matches
            .map((m, i) => {
                const segmentStyles = { '--weight': m.matched ? 'bold' : 'normal' } as React.CSSProperties
                return (
                    <TextSegment style={segmentStyles} key={i}>
                        {m.text}
                    </TextSegment>
                )
            })}
    </span>
}

const TextSegment = styled.span`
    font-weight: var(--weight);
`

export default FuseMatch