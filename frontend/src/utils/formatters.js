export const formatPrice = (price) => {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "LKR",
  }).format(price);
};

export const formatDate = (date) => {
  return new Intl.DateTimeFormat("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(date));
};

export const getStatusColor = (status) => {
  const colorMap = {
    pending: "yellow",
    confirmed: "blue",
    shipped: "indigo",
    delivered: "green",
    paid: "green",
    approved: "green",
    rejected: "red",
    cancelled: "red",
    active: "green",
    inactive: "gray",
  };
  return colorMap[status?.toLowerCase()] || "gray";
};

export const formatStatus = (status) => {
  return status
    ?.split("_")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
};

export const truncate = (text, length = 50) => {
  return text?.length > length ? text.substring(0, length) + "..." : text;
};
