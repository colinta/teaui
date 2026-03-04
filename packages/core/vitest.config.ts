import {defineConfig, mergeConfig} from 'vitest/config'
import shared from '../../shared/vitest.config.js'

export default mergeConfig(shared, defineConfig({}))
