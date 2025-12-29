function getMode() {
  const mode = process.env.DRAFT_MODE;
  if (mode && (mode.toLowerCase() === 'fast' || mode.toLowerCase() === 'strict')) {
    return mode.toLowerCase();
  }
  return 'strict';
}

function shouldTreatWarningsAsErrors() {
  return getMode() === 'strict';
}

function modeTag() {
  const mode = getMode();
  return mode === 'fast' ? 'draft_unstable' : 'stable';
}

module.exports = {
  getMode,
  shouldTreatWarningsAsErrors,
  modeTag
};
