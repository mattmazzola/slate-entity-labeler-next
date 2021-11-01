/**
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */
import * as React from 'react'
import Fuse from 'fuse.js'
import { convertMatchedTextIntoMatchedOption, MatchedOption } from '../FuseMatch'
import { Option } from './models'

/**
 * See http://fusejs.io/ for information about options meaning and configuration
 */
const fuseOptions: Fuse.IFuseOptions<Option> = {
    shouldSort: true,
    includeMatches: true,
    threshold: 0.4,
    location: 0,
    distance: 10,
    // maxPatternLength: 32,
    minMatchCharLength: 1,
    keys: [
        "name"
    ]
}

type IndexFunction = (x: number, limit: number) => number
const id: IndexFunction = (x: number) => x
const increment: IndexFunction = (x: number, limit: number) => (x + 1) > limit ? 0 : x + 1
const decrement: IndexFunction = (x: number, limit: number) => (x - 1) < 0 ? limit : x - 1

const convertOptionToMatchedOption = (option: Option): MatchedOption<Option> => {
    return {
        highlighted: false,
        matchedStrings: [{ text: option.name, matched: false }],
        original: option
    }
}

const getMatchedOptions = (
    searchText: string,
    options: Option[],
    fuse: Fuse<Option>,
    maxDisplayedOptions: number
): MatchedOption<Option>[] => {
    return searchText.trim().length === 0
        ? options
            .filter((_, i) => i < maxDisplayedOptions)
            .map(convertOptionToMatchedOption)
        : fuse.search(searchText)
            .filter((_, i) => i < maxDisplayedOptions)
            .map(result => convertMatchedTextIntoMatchedOption(result.item.name, result.matches?.[0].indices ?? [], result.item))
}

export const usePicker = (
    options: Option[],
    maxDisplayedOptions: number,
    onSelectOption: (option: Option) => void,
) => {
    const fuseRef = React.useRef(new Fuse(options, fuseOptions))
    const [searchText, setSearchText] = React.useState('')
    const [highlightIndex, setHighlighIndex] = React.useState(0)
    const [matchedOptions, setMatchedOptions] = React.useState<MatchedOption<Option>[]>([])

    const resetHighlighIndex = () => setHighlighIndex(0)
    const onSelectHighlightedOption = () => {
        const matchedOption = matchedOptions[highlightIndex]
        if (matchedOption) {
            onSelectOption(matchedOption.original)
        }
    }

    React.useEffect(() => {
        fuseRef.current = new Fuse(options, fuseOptions)
        const matchedOptions = getMatchedOptions(searchText, options, fuseRef.current, maxDisplayedOptions)
        setMatchedOptions(matchedOptions)
    }, [options.length, searchText, maxDisplayedOptions])

    // Ensure highlight index is within bounds
    React.useEffect(() => {
        // Decrease highlight index to last item when options list shrinks due to search filter
        let min = highlightIndex > (matchedOptions.length - 1)
            ? (matchedOptions.length - 1)
            : highlightIndex

        // Don't allow an index less than 0 (if options length is 0)
        min = Math.max(0, min)
        setHighlighIndex(min)
    }, [matchedOptions.length, highlightIndex])

    const onKeyDown = (event: React.KeyboardEvent<HTMLElement>) => {
        let modifyFunction: IndexFunction = id
        switch (event.key) {
            case 'ArrowUp': {
                modifyFunction = decrement
                break
            }
            case 'ArrowDown':
                modifyFunction = increment
                break
            // TODO: Should we allow tab completion?
            // case 'Tab':
            case 'Enter':
                // Only simulate completion on 'forward' tab
                if (event.shiftKey) {
                    return
                }

                onSelectHighlightedOption()
                event.stopPropagation()
                event.preventDefault()
                break
            default:
        }

        setHighlighIndex(modifyFunction(highlightIndex, matchedOptions.length - 1))
    }

    return {
        searchText,
        setSearchText,
        onKeyDown,
        matchedOptions,
        highlightIndex,
        resetHighlighIndex,
    }
}