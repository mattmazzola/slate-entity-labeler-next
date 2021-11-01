import React from 'react'
import styled from 'styled-components'
import { Ancestor, BaseSelection, createEditor, Node, NodeEntry, Path, Point, Range, Transforms } from 'slate'
import { Slate, Editable, withReact, DefaultElement, RenderElementProps } from 'slate-react'

import { convertEntitiesAndTextToTokenizedEditorValue, isGivenElementChildOfOtherElement, CustomEditor, CustomText, deserialize, debounce, CustomElement, serialize, withLabels } from './utils'
import { DebugMode, LabeledEntity, LabelMode, EntityData, Entity } from './models'
import { EntityPicker, PickerProps } from './EntityPicker'
import { TokenElement, EntityElement, ParagraphElement } from './CustomElements'
import { LabeledText } from '.'

const getFirstTokenAncestor = (rootNode: Node, path: Path) => {
    const firstTokenAncestor = [...Node.ancestors(rootNode, path, { reverse: true })]
        .find(([node]) => Node.isNode(node) && (node as CustomElement).type === 'token')

    return firstTokenAncestor
}

const editOperationTypes = [
    'remove_text',
    'insert_text',
]

// Need these operations to use Transforms.wrapNodes
const externalOperationsType = [
    'remove_node',
    'insert_node',
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
    labelMode: LabelMode
    labeledText: LabeledText<EntityData>,
    entities: Entity[]
    onChangeValue: (value: CustomElement[]) => void
    onChangeLabeledText: (labeledText: LabeledText<EntityData>) => void
}

const entityLabelerDebugKey = 'entity-labeler'

const EntityLabeler: React.FC<Props> = props => {
    const editor = React.useMemo(() => withLabels(withReact(createEditor())), [])
    const [pickerProps, setPickerProps] = React.useState<PickerProps>(initialPickerProps)
    const closePicker = () => {
        setPickerProps(p => ({
            ...p,
            isVisible: false
        }))
    }
    const editorWrapperRef = React.useRef<HTMLDivElement>(null)
    const entityPickerRef = React.useRef<HTMLDivElement>(null)
    const debugModeValue = localStorage.getItem(entityLabelerDebugKey)
    const debugMode = typeof debugModeValue === 'string' && debugModeValue !== null
        ? DebugMode.Debug
        : DebugMode.Normal

    const debouncedSlateValueChange = React.useCallback(debounce(props.onChangeValue, 300), [props.onChangeValue])
    const debouncedLabeledTextChange = React.useCallback(debounce(props.onChangeLabeledText, 300), [props.onChangeLabeledText])
    const debouncedSelectionChange = React.useCallback(debounce(() => {
        if (!editor.selection) {
            return
        }

        if (Range.isCollapsed(editor.selection)) {
            closePicker()
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

    const [slateValue, setSlateValue] = React.useState<CustomElement[]>(deserialize(props.labeledText.text))
    const lastLabelModeRef = React.useRef<LabelMode | undefined>()
    const lastNonNullSelectionRef = React.useRef<BaseSelection>(null)

    React.useEffect(() => {
        debouncedSlateValueChange(slateValue)
    }, [slateValue, debouncedSlateValueChange])

    React.useEffect(() => {
        // If label mode is set and has changed
        if (lastLabelModeRef.current && lastLabelModeRef.current !== props.labelMode) {
            const serializedValue = serialize(slateValue)

            switch (props.labelMode) {
                case LabelMode.EditText: {
                    // Get text from value by serializing and deserializing
                    const newSlateValue = deserialize(serializedValue)
                    setSlateValue(newSlateValue)

                    // Get new lableed text value with reset entities
                    const newLabeledText: LabeledText<EntityData> = {
                        text: serializedValue,
                        entities: []
                    }

                    props.onChangeLabeledText(newLabeledText)

                    // Reset picker
                    closePicker()
                    break
                }
                case LabelMode.Label: {
                    const slateValue = convertEntitiesAndTextToTokenizedEditorValue(props.labeledText)
                    setSlateValue(slateValue)
                    break
                }
            }
        }

        lastLabelModeRef.current = props.labelMode
    }, [props.labelMode])

    const onBlurSlateEditorWrapper: React.FocusEventHandler<HTMLDivElement> = (e) => {
        const focusedElement = e.relatedTarget as Element
        if (entityPickerRef.current) {
            const isFocusedElementChildOfPicker = isGivenElementChildOfOtherElement(focusedElement, entityPickerRef.current)

            if (isFocusedElementChildOfPicker) {
                return
            }
        }

        closePicker()
    }

    const onPickerCreateEntity = () => {
        // TODO: Likely open more complicated entity creation wizard
        // But for now just create random entity
        const randomValue = Math.floor(Math.random() * 100)
        const entityPrefix = `entityName-${randomValue}`
        const mockEntity: Entity = {
            id: entityPrefix,
            name: entityPrefix
        }

        onSelectEntity(mockEntity)
    }

    const onSelectEntity = (entity: Entity) => {
        const selection = editor.selection ?? lastNonNullSelectionRef.current
        if (selection && Range.isCollapsed(selection)) {
            return
        }

        // Create entity around selection
        CustomEditor.toggleBlockEntity(editor, entity.id, entity.name, selection)

        // Reset last selection
        lastNonNullSelectionRef.current = null

        closePicker()
    }

    const onEditableKeyDown: React.KeyboardEventHandler<HTMLDivElement> = event => {
        if (props.labelMode === LabelMode.Label) {
            // console.log({ key: event.key })
            switch (event.key) {
                case 'Escape':
                    closePicker()
                    event.preventDefault()
                    break
                case ' ':
                case 'Enter':
                case 'Backspace':
                case 'Delete':
                    event.preventDefault()
                    event.stopPropagation()
            }
        }
    }

    const onEditableDrop: React.DragEventHandler<HTMLDivElement> = event => {
        return false
    }

    return (
        <Slate
            editor={editor}
            value={slateValue}
            onChange={value => {
                // If selection is defined, save selection for use after it is removed due to blur
                if (editor.selection !== null) {
                    lastNonNullSelectionRef.current = editor.selection
                }

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

                // Apply values changes
                const customValue = value as CustomElement[]
                setSlateValue(customValue)

                if (props.labelMode === LabelMode.Label && containsSelectionOperations) {
                    debouncedSelectionChange()
                }

                const isAstChange = editor.operations.some(op => selectionOperationType !== op.type)
                if (isAstChange) {
                    debouncedSlateValueChange(customValue)

                    const text = serialize(customValue)
                    const entities = CustomEditor.getEntities(editor)
                    const newLabeledText: LabeledText<EntityData> = {
                        text,
                        entities
                    }

                    debouncedLabeledTextChange(newLabeledText)
                }
            }}
        >
            <EditorWrapper
                ref={editorWrapperRef}
                onBlur={onBlurSlateEditorWrapper}
            >
                <Editable
                    onKeyDown={onEditableKeyDown}
                    onDragStart={() => false}
                    onDrop={onEditableDrop}
                    renderElement={renderElementProps => renderElement(renderElementProps, debugMode)}
                />
                <EntityPicker
                    ref={entityPickerRef}
                    isVisible={pickerProps.isVisible}
                    position={pickerProps.position}
                    entities={props.entities}
                    onClickCreate={onPickerCreateEntity}
                    onSelectEntity={onSelectEntity}
                    onDismissPicker={() => closePicker()}
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
`

const renderElement = (props: RenderElementProps, mode: DebugMode) => {
    switch (props.element.type) {
        case 'paragraph':
            return <ParagraphElement {...props} />
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

