function moveAdminItem<T>(
    values: readonly T[],
    index: number,
    direction: -1 | 1
): T[] {
    const target = index + direction;
    if (target < 0 || target >= values.length) {
        return [...values];
    }

    const result = [...values];
    const current = result[index];
    const replacement = result[target];
    if (current === undefined || replacement === undefined) {
        return result;
    }

    result[index] = replacement;
    result[target] = current;
    return result;
}

export {
    moveAdminItem
};
