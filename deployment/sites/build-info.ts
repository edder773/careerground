declare const __CAREERGROUND_BUILD_COMMIT__: string;

export const BUILD_FEATURE_VERSION = 'slack-digest-history-v1';
export const BUILD_COMMIT_SHA =
  typeof __CAREERGROUND_BUILD_COMMIT__ === 'string' ? __CAREERGROUND_BUILD_COMMIT__ : 'development';

export const BUILD_INFO = {
  commitSha: BUILD_COMMIT_SHA,
  featureVersion: BUILD_FEATURE_VERSION,
} as const;
