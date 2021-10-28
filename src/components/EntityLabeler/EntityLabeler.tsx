import React from 'react'
import styled from 'styled-components'
import { BaseSelection, createEditor, Editor, Node, Path, Point, Range, SelectionOperation, Transforms } from 'slate'
import { Slate, Editable, withReact, DefaultElement, RenderElementProps } from 'slate-react'

import { convertEntitiesAndTextToTokenizedEditorValue, CustomEditor, CustomText, deserialize, debounce, defaultValue, CustomElement, serialize, withLabels } from './utils'
import { DebugMode, IEntity, LabelMode } from './models'
import { EntityPicker } from './EntityPicker'
import { TokenElement } from './TokenElement'
import { EntityElement } from './EntityElement'
import { EntityData } from '.'

const getFirstTokenAncestor = (rootNode: Node, path: Path) => {
    const firstTokenAncestor = [...Node.ancestors(rootNode, path, { reverse: true })]
        .find(([node]) => Node.isNode(node) && (node as CustomElement).type === 'token')

    return firstTokenAncestor
}

const selectionChange = (editor: Editor) => {
    if (!editor.selection || Range.isCollapsed(editor.selection)) {
        return
    }

    const start = Range.start(editor.selection)
    const end = Range.end(editor.selection)

    const startTokenEntry = getFirstTokenAncestor(editor, start.path)
    const endTokenEntry = getFirstTokenAncestor(editor, end.path)

    // If we found a start and end token from selection search, expand selection to those token boundaries
    if (startTokenEntry && endTokenEntry) {
        const [_, startTokenPath] = startTokenEntry
        // Get point at start of start token
        const startPoint: Point = {
            path: startTokenPath,
            offset: 0
        }

        // Get point at end of end token
        const [endToken, endTokenPath] = endTokenEntry
        const endPoint: Point = {
            path: endTokenPath,
            // There is assumption here that token contains single text element. (This could be made more robust)
            offset: (endToken.children[0] as CustomText).text.length
        }

        const selectionLocation = {
            anchor: startPoint,
            focus: endPoint,
        }

        Transforms.select(editor, selectionLocation)
    }
}

const editOperationTypes = [
    'remove_text',
    'insert_text',
    // Need these operations to use Transforms.wrapNodes
    // 'remove_node',
    // 'insert_node',
]

const selectionOperationType = 'set_selection'

type Props = {
    text: string,
    entities: IEntity<EntityData>[]
    labelMode: LabelMode
    debugMode: DebugMode
    onChangeValue: (value: CustomElement[]) => void
    onChangeText: (text: string) => void
    onChangeEntities: (entities: IEntity<EntityData>[]) => void
}

const EntityLabeler: React.FC<Props> = props => {
    const debouncedValueChange = React.useCallback(debounce(props.onChangeValue, 300), [props.onChangeValue])
    const debouncedTextChange = React.useCallback(debounce(props.onChangeText, 300), [props.onChangeText])
    const debouncedEntitiesChange = React.useCallback(debounce(props.onChangeEntities, 300), [props.onChangeEntities])
    const debouncedSelectionChange = React.useCallback(debounce(selectionChange, 300), [])

    const [value, setValue] = React.useState<CustomElement[]>(defaultValue)
    const lastLabelModeRef = React.useRef<LabelMode | undefined>()

    React.useEffect(() => {
        debouncedValueChange(value)
    }, [value])

    React.useEffect(() => {
        switch (props.labelMode) {
            case LabelMode.EditText: {
                const newValue = deserialize(props.text)
                setValue(newValue)
                break
            }
            case LabelMode.Label: {
                const newValue = convertEntitiesAndTextToTokenizedEditorValue(props.text, props.entities)
                setValue(newValue)
                break
            }
        }
    }, [props.text])

    React.useEffect(() => {
        // If label mode is set and has changed
        if (lastLabelModeRef.current && lastLabelModeRef.current !== props.labelMode) {
            const serializedValue = serialize(value)

            switch (props.labelMode) {
                case LabelMode.EditText: {
                    const newValue = deserialize(serializedValue)
                    setValue(newValue)
                    break
                }
                case LabelMode.Label: {
                    const newValue = convertEntitiesAndTextToTokenizedEditorValue(serializedValue, [])
                    setValue(newValue)
                    break
                }
            }
        }

        lastLabelModeRef.current = props.labelMode
    }, [props.labelMode])

    const editor = React.useMemo(() => withLabels(withReact(createEditor())), [])

    return (
        <Slate
            editor={editor}
            value={value}
            onChange={value => {
                const appliedEditOperations = editor.operations.filter(op => {
                    return editOperationTypes.find(editOpType => editOpType === op.type)
                })

                const containsEditOperation = appliedEditOperations.length > 0
                // If in label mode and contains edit operations, terminate early to prevent text modifications
                // Note: Still allow operations to Label Entities / WrapNodes
                if (props.labelMode === LabelMode.Label && containsEditOperation) {
                    console.warn(`Edit operations blocked: `, appliedEditOperations.map(o => o.type))
                    return
                }

                const selectionOperations: SelectionOperation[] = editor.operations
                    .filter(op => selectionOperationType === op.type) as any[]
                const containsSelectionOperations = selectionOperations.length > 0
                if (props.labelMode === LabelMode.Label && containsSelectionOperations) {
                    // console.log('Operations: ', editor.operations)
                    debouncedSelectionChange(editor)
                }

                const customValue = value as CustomElement[]
                setValue(customValue)

                const isAstChange = editor.operations.some(op => selectionOperationType !== op.type)
                if (isAstChange) {
                    debouncedValueChange(customValue)

                    const text = serialize(customValue)
                    debouncedTextChange(text)
                    const entities = CustomEditor.getEntities(editor)
                    debouncedEntitiesChange(entities)
                }
            }}
        >
            <EditorWrapper>
                <Editable
                    renderElement={renderElementProps => renderElement(renderElementProps, props.debugMode)}
                />
                <EntityPicker
                    options={['one', 'two', 'three']}
                    onClickCreate={(entityId, entityName) => CustomEditor.toggleBlockEntity(editor, entityId, entityName)}
                />
            </EditorWrapper>
        </Slate>
    )
}

const EditorWrapper = styled.div`
    border: 1px solid var(--color-white);
    border-radius: 3px;
    padding: 0.5rem;
    position: relative;

    [data-slate-editor="true"] :is(p, pre) {
        padding: 0;
        margin: 0;
    }
`

const renderElement = (props: RenderElementProps, mode: DebugMode) => {
    switch (props.element.type) {
        case 'entity':
            return <EntityElement {...props} mode={mode} />
        case 'token':
            return <TokenElement {...props} mode={mode} />
        default:
            return <DefaultElement {...props} />
    }
}

export default EntityLabeler
