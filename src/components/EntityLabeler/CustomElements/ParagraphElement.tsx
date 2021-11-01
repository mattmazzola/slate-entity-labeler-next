import { RenderElementProps } from "slate-react"
import styled from "styled-components"

type Props = RenderElementProps

export const ParagraphElement: React.FC<Props> = props => {
    return (
        <ParagraphWrapper
            {...props.attributes}
            data-is-paragraph={true}
        >
            {props.children}
        </ParagraphWrapper>
    )
}

const ParagraphWrapper = styled.div`
    padding: 0.8em 0 0 0;
`
