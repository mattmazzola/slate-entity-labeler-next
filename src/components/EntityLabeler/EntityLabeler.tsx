import React from 'react'
import styled from 'styled-components'
import { Ancestor, createEditor, Editor, Node, NodeEntry, Path, Point, Range, SelectionOperation, Transforms } from 'slate'
import { Slate, Editable, withReact, DefaultElement, RenderElementProps } from 'slate-react'

import { convertEntitiesAndTextToTokenizedEditorValue, CustomEditor, CustomText, deserialize, debounce, defaultValue, CustomElement, serialize, withLabels } from './utils'
import { DebugMode, IEntity, LabelMode } from './models'
import { EntityPicker, PickerProps } from './EntityPicker'
import { TokenElement } from './TokenElement'
import { EntityElement } from './EntityElement'
import { EntityData } from '.'

const getFirstTokenAncestor = (rootNode: Node, path: Path) => {
    const firstTokenAncestor = [...Node.ancestors(rootNode, path, { reverse: true })]
        .find(([node]) => Node.isNode(node) && (node as CustomElement).type === 'token')

    return firstTokenAncestor
}

const selectionChange = (
    editor: Editor,
    parentRef: React.RefObject<HTMLDivElement>
) => {
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

    if (parentRef.current) {
        const parentElement = parentRef.current
        const domSelection = globalThis.getSelection()
        if (domSelection) {
            const parentElementBox = parentElement.getBoundingClientRect()
            const domSelectionRange = domSelection.getRangeAt(0)
            const domSelectionBox = domSelectionRange.getBoundingClientRect()

            console.log({ parentElementBox, domSelectionBox })
        }
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

const initialPickerProps: PickerProps = {
    isVisible: false,
    position: {
        top: 0,
        left: 0,
    }
}

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
    const editor = React.useMemo(() => withLabels(withReact(createEditor())), [])
    const [pickerProps, setPickerProps] = React.useState<PickerProps>(initialPickerProps)
    React.useEffect(() => {
        console.log({ pickerProps })
    }, [pickerProps])
    const editorWrapperRef = React.useRef<HTMLDivElement>(null)
    const entityPickerRef = React.useRef<HTMLDivElement>(null)

    const debouncedValueChange = React.useCallback(debounce(props.onChangeValue, 300), [props.onChangeValue])
    const debouncedTextChange = React.useCallback(debounce(props.onChangeText, 300), [props.onChangeText])
    const debouncedEntitiesChange = React.useCallback(debounce(props.onChangeEntities, 300), [props.onChangeEntities])
    const debouncedSelectionChange = React.useCallback(debounce(() => {
        if (!editor.selection || Range.isCollapsed(editor.selection)) {
            setPickerProps(p => ({
                ...p,
                isVisible: false
            }))
            return
        }

        const start = Range.start(editor.selection)
        const end = Range.end(editor.selection)

        let startTokenEntry = getFirstTokenAncestor(editor, start.path)
        let endTokenEntry = getFirstTokenAncestor(editor, end.path)

        // If either entry is undefined, set to other value
        startTokenEntry = startTokenEntry ?? endTokenEntry
        endTokenEntry = endTokenEntry ?? startTokenEntry

        // If we found a start and end token from selection search, expand selection to those token boundaries
        if (startTokenEntry && endTokenEntry) {
            expandSelection(startTokenEntry, endTokenEntry, editor)

            // Get picker props
            if (editorWrapperRef.current && entityPickerRef.current) {
                const domSelection = globalThis.getSelection()
                if (domSelection) {
                    const pickerProps = getPickerProps(
                        editorWrapperRef.current,
                        entityPickerRef.current,
                        domSelection
                    )

                    setPickerProps(pickerProps)
                }
            }
        }

    }, 300), [])

    const [value, setValue] = React.useState<CustomElement[]>(defaultValue)
    const lastLabelModeRef = React.useRef<LabelMode | undefined>()

    React.useEffect(() => {
        debouncedValueChange(value)
    }, [value, debouncedValueChange])

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
                    // Get text from value by serializing and deserializing
                    const newValue = deserialize(serializedValue)
                    setValue(newValue)
                    // Reset picker
                    setPickerProps(p => ({
                        ...p,
                        isVisible: false
                    }))
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


    return (
        <Slate
            editor={editor}
            value={value}
            onChange={value => {
                const attemptedEditOperations = editor.operations.filter(op => {
                    return editOperationTypes.find(editOpType => editOpType === op.type)
                })

                const containsEditOperation = attemptedEditOperations.length > 0
                // If in label mode and contains edit operations, terminate early to prevent text modifications
                // Note: Still allow operations to Label Entities / WrapNodes
                if (props.labelMode === LabelMode.Label && containsEditOperation) {
                    console.warn(`Edit operations blocked: `, attemptedEditOperations.map(o => o.type))
                    return
                }

                const selectionOperations = editor.operations
                    .filter(op => selectionOperationType === op.type)
                const containsSelectionOperations = selectionOperations.length > 0

                if (props.labelMode === LabelMode.Label && containsSelectionOperations) {
                    debouncedSelectionChange()
                }

                // Apply values changes
                const customValue = value as CustomElement[]
                setValue(customValue)

                const isAstChange = editor.operations.some(op => selectionOperationType !== op.type)
                if (isAstChange) {
                    debouncedValueChange(customValue)

                    const text = serialize(customValue)
                    debouncedTextChange(text)

                    if (props.labelMode === LabelMode.Label) {
                        const entities = CustomEditor.getEntities(editor)
                        debouncedEntitiesChange(entities)
                    }
                }
            }}
        >
            <EditorWrapper
                ref={editorWrapperRef}
            >
                <Editable
                    renderElement={renderElementProps => renderElement(renderElementProps, props.debugMode)}
                />
                <EntityPicker
                    ref={entityPickerRef}
                    isVisible={pickerProps.isVisible}
                    position={pickerProps.position}
                    options={['one', 'two', 'three', 'three', 'three', 'three', 'three']}
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

function getPickerProps(
    parentElement: HTMLDivElement,
    pickerElement: HTMLDivElement,
    domSelection: Selection,
) {
    const parentElementRect = parentElement.getBoundingClientRect()
    const domSelectionRange = domSelection.getRangeAt(0)
    const domSelectionRect = domSelectionRange.getBoundingClientRect()

    // Goal is to get relative coordinate offsets based on comparing absolute values
    // Get relative left
    const relativeSelectionLeft = domSelectionRect.left - parentElementRect.left
    const halfSelectionWidth = domSelectionRect.width / 2
    const centerOfSelectionLeft = relativeSelectionLeft + halfSelectionWidth
    const halfPickerWidth = pickerElement.offsetWidth / 2
    const relativePickerLeft = centerOfSelectionLeft - halfPickerWidth
    const constrainedLeft = Math.max(0, relativePickerLeft)

    // Get relative top
    const pickerSpacer = 10
    const relativeSelectionTop = domSelectionRect.top - parentElementRect.top
    const top = relativeSelectionTop + domSelectionRect.height + pickerSpacer

    const pickerProps: PickerProps = {
        isVisible: true,
        position: {
            top,
            left: constrainedLeft
        }
    }
    return pickerProps
}

function expandSelection(
    startTokenEntry: NodeEntry<Ancestor>,
    endTokenEntry: NodeEntry<Ancestor>,
    editor: CustomEditor
) {
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

