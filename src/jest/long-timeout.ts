export function setLongJestTimeout() {
    // Github Actions is really slow so we need more time
    jest.setTimeout(30000);
}
