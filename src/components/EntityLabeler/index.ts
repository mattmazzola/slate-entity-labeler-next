import EntityLabeler from './EntityLabeler'
// Note: Only intend to export IEntity, but CRA isolatedModules for babel error blocks
export * from './models'
export * from './utils'
export {
    LabelMode,
    DebugMode
} from './EntityLabeler'

export default EntityLabeler