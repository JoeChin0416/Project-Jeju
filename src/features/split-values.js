export function buildSplitValues(participantIds, mode, rawValues = {}, total = 0) {
  const ids = [...new Set(participantIds ?? [])];
  if (mode === "equal" || ids.length === 0) return {};

  if (mode === "ratio") {
    const values = Object.fromEntries(ids.map((id) => [id, Math.max(0, Number(rawValues[id] || 0))]));
    const hasWeight = Object.values(values).some((value) => value > 0);
    return hasWeight ? values : Object.fromEntries(ids.map((id) => [id, 1]));
  }

  if (mode === "fixed") {
    const values = Object.fromEntries(ids.map((id) => [id, roundMoney(rawValues[id] || 0)]));
    const hasAmount = Object.values(values).some((value) => value > 0);
    if (hasAmount) return values;

    const share = roundMoney(Number(total || 0) / ids.length);
    return Object.fromEntries(ids.map((id) => [id, share]));
  }

  return {};
}

export function readSplitValuesFromForm(form) {
  return [...form.querySelectorAll("[data-split-value]")]
    .reduce((values, input) => {
      values[input.dataset.splitValue] = input.value;
      return values;
    }, {});
}

function roundMoney(value) {
  return Math.round(Number(value || 0) * 100) / 100;
}

