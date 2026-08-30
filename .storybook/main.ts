import type { StorybookConfig } from '@storybook/react-vite';

const config: StorybookConfig = {
  stories: ['../src/**/*.mdx', '../src/**/*.stories.@(ts|tsx)'],
  addons: [
    '@storybook/addon-docs',
    // Runs axe-core in the browser against every story. This is the
    // automated-checks layer the review pipeline lists as stage 1 and has
    // never actually executed — eslint-plugin-jsx-a11y was never installed.
    '@storybook/addon-a11y',
  ],
  framework: {
    name: '@storybook/react-vite',
    options: {},
  },
};

export default config;
