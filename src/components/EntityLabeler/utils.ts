import { Editor, BaseText, Transforms, BaseEditor, Node, BaseSelection } from 'slate'
import { ReactEditor } from 'slate-react'
import { EntityData } from '.'
import { LabeledEntity, EntityPlaceholder, Token, TokenOrEntity, TokenType } from './models'

type CustomElementBase = {
    children: (CustomText | CustomElement)[]
}

type SlateToken = CustomElementBase & {
    type: "token"
    tokenIndex: number
}

type SlateEntity = CustomElementBase & {
    type: "entity"
    entityId: string
    entityName: string
}

type SlateParagraph = CustomElementBase & {
    type: "paragraph"
}

export type CustomElement = SlateParagraph | SlateEntity | SlateToken

export type CustomText = BaseText & {
}

export type CustomEditor = ReactEditor & BaseEditor

declare module 'slate' {
    interface CustomTypes {
        Editor: CustomEditor
        Element: CustomElement
        Text: CustomText
    }
}

export const CustomEditor = {
    ...Editor,

    isParagraph(editor: CustomEditor) {
        const [firstMatchedNode] = CustomEditor.nodes<CustomElement>(editor, {
            match: n => (n as CustomElement).type === 'paragraph',
        })

        return Boolean(firstMatchedNode)
    },
    isEntity(editor: CustomEditor) {
        const [firstMatchNode] = CustomEditor.nodes<CustomElement>(editor, {
            match: n => (n as CustomElement).type === 'entity',
        })

        return Boolean(firstMatchNode)
    },

    getEntities(editor: CustomEditor) {
        // TODO: This is only getting entities within the selection. It should get ALL entities
        const entitiesNodeEntries = [...CustomEditor.nodes(editor, {
            at: {
                anchor: Editor.start(editor, []),
                focus: Editor.end(editor, []),
            },
            match: n => (n as CustomElement).type === 'entity',
            mode: 'all'
        })]

        const entities = entitiesNodeEntries
            .map<LabeledEntity<EntityData>>(([node, path]) => {
                // Attempt to use Slate Node API but it was more complicated
                // Note.elements returns root Node?
                // const tokenNodeEntries = [...Node.elements(entityNode, {
                //     pass: ([n, p]) => (n as CustomElement).type === 'token'
                // })]

                const entityNode = node as SlateEntity

                let startTokenIndex = -1
                let tokenLength = 1
                let tokensElements = entityNode.children
                    .filter(n => (n as CustomElement).type === 'token')

                const tokens = tokensElements as SlateToken[]
                if (tokens.length > 0) {
                    const firsToken = tokens[0]
                    startTokenIndex = firsToken.tokenIndex
                    tokenLength = tokens.length
                }

                // If you only select a single token, Transforms.wrapNodes will wrap the text
                // inside the token nstead of wrapping the token
                // In this case, we get the parent token and then reinsert it into the entity
                else {
                    const parent = Node.parent(editor, path)
                    if ((parent as CustomElement).type === "token") {
                        startTokenIndex = (parent as any).tokenIndex
                    }
                }

                const text = Node.string(entityNode)
                const entity: LabeledEntity<EntityData> = {
                    data: {
                        name: entityNode.entityName,
                        text
                    },
                    id: entityNode.entityId,
                    startTokenIndex,
                    tokenLength,
                }

                return entity
            })

        return entities
    },

    toggleBlockEntity(
        editor: CustomEditor,
        entityId: string,
        entityName: string,
        selection?: BaseSelection
    ) {
        Transforms.wrapNodes(
            editor,
            { type: 'entity', entityId, entityName } as CustomElement,
            {
                split: true,
                at: selection ?? undefined
            }
        )

        const start = Editor.start(editor, [0, 0])
        Transforms.select(editor, {
            anchor: start,
            focus: start,
        })
    }
}

export const withLabels = (editor: CustomEditor) => {
    const { isInline } = editor

    editor.isInline = (element: CustomElement) => {
        switch (element.type) {
            case 'entity': {
                return true
            }
            case 'token': {
                return true
            }
        }

        return isInline(element)
    }

    return editor
}

export const serialize = (value: CustomElement[]) => {
    return (
        value
            // Return the string content of each paragraph in the value's children.
            .map(n => Node.string(n))
            // Join them all with line breaks denoting paragraphs.
            .join('\n')
    )
}

export const deserialize = (value: string): CustomElement[] => {
    // Return a value array of children derived by splitting the string.
    return value.split('\n')
        .map(line => {
            return {
                type: 'paragraph',
                children: [{ text: line }],
            }
        })
}

export const debounce = <T extends (...args: any[]) => any>(fn: T, time: number) => {
    let timeoutId: NodeJS.Timeout

    const debouncedFn = (...args: Parameters<T>) => {
        if (timeoutId) {
            clearTimeout(timeoutId)
        }

        timeoutId = setTimeout(() => {
            fn(...args)
        }, time)
    }

    return debouncedFn
}

export const isGivenElementChildOfOtherElement = (e: Element, targetParent: Element): boolean => {
    let currentElement = e
    let currentCount = 0
    let maxDomCount = 10

    while (currentElement) {
        if (currentElement === targetParent) {
            return true
        }
        if (currentCount > maxDomCount) {
            break
        }
        if (currentElement === document.parentElement) {
            return false
        }

        currentCount += 1
        currentElement = currentElement.parentElement!
    }

    return false
}

/**
 * Note: this is more like a negative match used to determine characters that split the string instead of
 * positive match would specify characters which are tokens. Only chose this because it seems like a much
 * simpler regex / smaller set of characters, but I imagine alternative approach would work
 */
export const tokenizeRegex = /[\s.?,!]+/g

export const tokenizeText = (
    text: string,
    tokenRegex: RegExp,
    tokenIndex = 0
): [Token[], number] => {
    const tokens: Token[] = []
    if (text.length === 0) {
        return [tokens, tokenIndex]
    }

    let regexMatchResult: RegExpExecArray | null = null
    let lastIndex = tokenRegex.lastIndex

    // tslint:disable-next-line:no-conditional-assignment
    while ((regexMatchResult = tokenRegex.exec(text)) !== null) {
        // The match is the token separator which is not selectable
        // meaning the non matched is selectable
        const matchedText = text.substring(lastIndex, regexMatchResult.index)
        const nonSelectableToken: Token = {
            type: TokenType.Token,
            text: matchedText,
            isSelectable: true,
            startCharIndex: lastIndex,
            tokenIndex,
        }

        tokenIndex += 1

        const selectableToken: Token = {
            type: TokenType.Token,
            text: regexMatchResult[0],
            isSelectable: false,
            startCharIndex: regexMatchResult.index,
            tokenIndex,
        }

        // TODO: Determine if non-selectable tokens increment the token count
        tokenIndex += 1

        tokens.push(...[
            nonSelectableToken,
            selectableToken
        ])

        lastIndex = tokenRegex.lastIndex
    }

    const endIndex = text.length
    const endText = text.substring(lastIndex, endIndex)
    if (endText.length > 0) {
        const endToken: Token = {
            type: TokenType.Token,
            text: endText,
            isSelectable: true,
            startCharIndex: lastIndex,
            tokenIndex,
        }

        tokens.push(endToken)
    }

    return [tokens, tokenIndex]
}

/**
 * Used for conversion of text and custom entities. For proper usage within extractor editor we need to tokenize the text.
 * This is what makes it different from the below method which doesn't need to be tokenized.
 *
 * @param text plain text
 * @param customEntities array of entities
 */
export const convertEntitiesAndTextToTokenizedEditorValue = (
    text: string,
    customEntities: LabeledEntity<EntityData>[]
) => {
    const normalizedEntities = normalizeEntities(customEntities)
    const lines = text.split('\n')

    // TODO: Need accumulative token indicies
    // Currently resets at each line
    // Alternative is to treat as a single line
    let lastTokenIndex = 0
    const tokenizedLlines = lines
        .map(line => {
            let tokenizedLine: Token[]
            [tokenizedLine, lastTokenIndex] = tokenizeText(line, tokenizeRegex, lastTokenIndex)
            const labeledTokens = labelTokens(tokenizedLine, normalizedEntities)
            return labeledTokens
        })

    return convertToSlateValue(tokenizedLlines)

    // const tokenizedLines = tokenizeText(text, tokenizeRegex)
    // const labeledTokenizedTokens = labelTokens(tokenizedLines, normalizedEntities)

    // return convertToSlateValue([labeledTokenizedTokens])
}

export const normalizeEntities = <T>(x: T): T => { return x }

export const labelTokens = <T>(tokens: Token[], customEntities: LabeledEntity<T>[]): TokenOrEntity<T>[] => {
    return wrapTokensWithEntities(tokens, customEntities)
}

/**
 * Similar to findIndex, but finds last index by iterating array items from end/right instead of start/left
 * @param xs Array
 * @param f Predicate function
 */
export const findLastIndex = <T>(xs: T[], f: (x: T) => boolean): number => {
    // tslint:disable-next-line:no-increment-decrement
    for (let i = xs.length - 1; i >= 0; i--) {
        if (f(xs[i])) {
            return i
        }
    }

    return -1
}

/**
 * (IToken[], ICustomEntityWithTokenIndicies[]) => (IToken | IEntityPlaceholder)[]
 * Given tokens and custom entities associated with tokens, replace tokens with entities placeholders
 * These entity placeholders eventually get converted to slate inline segments
 *
 * Simplified visual
 * [token0, token1, token2, token3, token4, token5, token6], [{token6, [1, 3]}]
 * [token0, [token1, token2, token3], token4, token5, token6]
 *
 * @param tokens Array of Tokens
 * @param entities Array of Custom Entities with Token Indicies
 */
export const wrapTokensWithEntities = <T>(tokens: Token[], entities: LabeledEntity<T>[]): TokenOrEntity<T>[] => {
    // If there are no entities than no work to do, return tokens
    if (entities.length === 0) {
        return tokens
    }

    const tokenArray: TokenOrEntity<T>[] = []
    const sortedEntities = [...entities].sort((a, b) => a.startTokenIndex - b.startTokenIndex)

    // Include all non labeled tokens before first entity
    const firstEntity = sortedEntities[0]
    const initialTokens = [...tokens.slice(0, firstEntity.startTokenIndex)]
    tokenArray.push(...initialTokens)

    // This requires entities to be non overlapping since each entity contains other tokens
    for (const [i, cet] of Array.from(sortedEntities.entries())) {
        // push labeled tokens
        const endTokenIndex = cet.startTokenIndex + cet.tokenLength
        const entity: EntityPlaceholder<T> = {
            type: TokenType.EntityPlaceholder,
            entity: cet,
            tokens: tokens.slice(cet.startTokenIndex, endTokenIndex)
        }

        tokenArray.push(entity)

        // If not at the last entity push non labeled tokens in between this and next entity
        if (i !== sortedEntities.length - 1) {
            const nextEntity = sortedEntities[i + 1]
            tokenArray.push(...tokens.slice(endTokenIndex, nextEntity.startTokenIndex))
        }
    }

    // Include all non labeled tokens after last entity
    const lastEntity = sortedEntities[sortedEntities.length - 1]
    const lastSelectedTokenIndex = lastEntity.startTokenIndex + lastEntity.tokenLength
    const endTokens = tokens.slice(lastSelectedTokenIndex)
    tokenArray.push(...endTokens)

    return tokenArray
}

export const defaultValue: CustomElement[] = [
    {
        type: 'paragraph',
        children: [
            {
                text: ''
            },
        ],
    }
]

export const convertToSlateValue = (tokensWithEntities: TokenOrEntity<EntityData>[][]): CustomElement[] => {
    // If there are no tokens, just return empty text node to ensure valid SlateValue object
    // In other words non-void parent nodes must have a child.
    if (tokensWithEntities.length === 0) {
        return defaultValue
    }

    const paragraphElements: CustomElement[] = []

    for (const tokenOrEntityRow of tokensWithEntities) {

        const tokensOrEntityElements: (CustomText | CustomElement)[] = []
        for (const tokenOrEntity of tokenOrEntityRow) {
            if (tokenOrEntity.type === TokenType.EntityPlaceholder) {
                const tokenElements = tokenOrEntity.tokens
                    .map<CustomElement>(token => {
                        return {
                            type: "token",
                            tokenIndex: token.tokenIndex,
                            children: [
                                {
                                    text: token.text
                                }
                            ]
                        }
                    })

                const entityElemnt: CustomElement = {
                    type: "entity",
                    entityId: tokenOrEntity.entity.id,
                    entityName: tokenOrEntity.entity.data.name,
                    children: tokenElements
                }

                tokensOrEntityElements.push(entityElemnt)
            }
            else {
                if (tokenOrEntity.isSelectable) {
                    const tokenElement: CustomElement = {
                        type: "token",
                        tokenIndex: tokenOrEntity.tokenIndex,
                        children: [
                            {
                                text: tokenOrEntity.text
                            }
                        ]
                    }
                    tokensOrEntityElements.push(tokenElement)
                }
                else {
                    const textElement: CustomText = {
                        text: tokenOrEntity.text
                    }

                    tokensOrEntityElements.push(textElement)
                }
            }
        }

        const paragraphElement: CustomElement = {
            type: 'paragraph',
            children: tokensOrEntityElements
        }

        paragraphElements.push(paragraphElement)
    }

    return paragraphElements
}

/**
 * Compare every entity to every other entity. If any have overlapping indices then log warning.
 *
 * @param customEntities List of custom entities
 */
export const warnAboutOverlappingEntities = (customEntities: LabeledEntity<object>[]): boolean => {
    return customEntities.some((entity, i) => {
        return customEntities
            .slice(i + 1)
            .some((otherEntity, _, es) => {
                // Other entity overlaps start index of current entity
                //  [ other entity ]
                //            [ entity ]
                const entityEndTokenIndex = entity.startTokenIndex + entity.tokenLength
                const otherEntityEndTokenIndex = otherEntity.startTokenIndex + otherEntity.tokenLength
                const overlapStartIndex = (otherEntity.startTokenIndex <= entity.startTokenIndex
                    && otherEntityEndTokenIndex >= entity.startTokenIndex)

                // Other entity overlaps end index of current entity
                //    [ other entity ]
                // [entity]
                const overlapEndIndex = (otherEntity.startTokenIndex <= entityEndTokenIndex
                    && otherEntityEndTokenIndex >= entityEndTokenIndex)

                const overlap = overlapStartIndex || overlapEndIndex

                if (overlap) {
                    console.warn(`Custom entities have overlap. Overlapping entities will be discarded to allow proper rendering in UI but this is a bug.`, customEntities)
                }

                return overlap
            })
    })
}
