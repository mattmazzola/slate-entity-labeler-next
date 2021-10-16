import { Editor, Element, BaseText, Text, Transforms, BaseEditor, Node } from 'slate'
import { ReactEditor } from 'slate-react'

export type CustomElement = {
    type: 'paragraph' | 'code' | 'entity'
    children: CustomText[]
}

export type CustomText = BaseText & {
    bold?: boolean
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

    isBoldMarkActive(editor: CustomEditor) {
        const [match] = CustomEditor.nodes(editor, {
            match: n => (n as CustomText).bold === true,
            universal: true,
        })

        return Boolean(match)
    },

    isCodeBlockActive(editor: CustomEditor) {
        const [match] = CustomEditor.nodes(editor, {
            match: n => (n as CustomElement).type === 'code',
        })

        return Boolean(match)
    },


    toggleBoldMark(editor: CustomEditor) {
        const isActive = CustomEditor.isBoldMarkActive(editor)
        Transforms.setNodes(
            editor,
            { bold: isActive ? null : true } as CustomText,
            { match: n => Text.isText(n), split: true }
        )
    },

    toggleCodeBlock(editor: CustomEditor) {
        const isActive = CustomEditor.isCodeBlockActive(editor)
        Transforms.setNodes(
            editor,
            { type: isActive ? null : 'code' } as CustomElement,
            { match: n => CustomEditor.isBlock(editor, n) }
        )
    },

    isEntity(editor: CustomEditor) {
        const [match] = CustomEditor.nodes(editor, {
            match: n => (n as CustomElement).type === 'entity',
        })

        return Boolean(match)
    },

    toggleBlockEntity(editor: CustomEditor) {
        const isEntity = CustomEditor.isEntity(editor)

        Transforms.wrapNodes(
            editor,
            { type: isEntity ? null : 'entity' } as CustomElement,
            { match: n => true, split: true }
        )
    },

    toggleInlineEntity(editor: CustomEditor) {
        const isEntity = CustomEditor.isEntity(editor)

        Transforms.setNodes(
            editor,
            { type: isEntity ? null : 'entity' } as CustomElement,
            { match: n => Text.isText(n), split: true }
        )
    }
}

export const withLabels = (editor: CustomEditor) => {
    const { isInline } = editor

    editor.isInline = (element: CustomElement) => {
        switch (element.type) {
            case 'entity': {
                console.log({ element })
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

export const deserialize = (value: string) => {
    // Return a value array of children derived by splitting the string.
    return value.split('\n')
        .map(line => {
            return {
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