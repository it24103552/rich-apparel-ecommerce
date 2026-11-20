export const filterBySearch = (data, searchTerm, searchKeys) => {
  if (!searchTerm || !searchKeys.length) return data;
  const lower = searchTerm.toLowerCase();

  const getNestedValue = (obj, path) => {
    return path.split('.').reduce((acc, part) => acc && acc[part], obj);
  };

  return data.filter((item) =>
    searchKeys.some((key) => {
      const value = key.includes('.') ? getNestedValue(item, key) : item[key];
      return String(value ?? "").toLowerCase().includes(lower);
    })
  );
};

export const filterByField = (data, field, value) => {
  if (!value) return data;
  return data.filter((item) => item[field] === value);
};

export const filterByFieldMultiple = (data, filters) => {
  return data.filter((item) =>
    Object.entries(filters).every(([key, value]) => {
      if (!value) return true;
      if (Array.isArray(value)) return value.includes(item[key]);
      return item[key] === value;
    })
  );
};

export const sortByField = (data, field, direction = "asc") => {
  const sorted = [...data].sort((a, b) => {
    const aVal = a[field];
    const bVal = b[field];

    if (aVal === null || aVal === undefined) return 1;
    if (bVal === null || bVal === undefined) return -1;

    if (typeof aVal === "string") {
      return direction === "asc"
        ? aVal.localeCompare(bVal)
        : bVal.localeCompare(aVal);
    }

    return direction === "asc" ? aVal - bVal : bVal - aVal;
  });
  return sorted;
};

export const paginateData = (data, page = 1, pageSize = 10) => {
  const start = (page - 1) * pageSize;
  const end = start + pageSize;
  return {
    data: data.slice(start, end),
    total: data.length,
    pages: Math.ceil(data.length / pageSize),
    currentPage: page,
  };
};
