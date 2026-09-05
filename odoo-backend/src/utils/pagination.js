/**
 * Parses and sanitizes pagination parameters from query string.
 * @param {Object} query - Express request query
 * @param {number} defaultPageSize - Default page size if not supplied (default: 20)
 * @param {number} maxPageSize - Maximum allowed page size (default: 100)
 * @returns {{ page: number, pageSize: number, skip: number, take: number }}
 */
function getPaginationParams(query = {}, defaultPageSize = 20, maxPageSize = 100) {
  let page = parseInt(query.page, 10);
  let pageSize = parseInt(query.pageSize, 10);

  if (isNaN(page) || page < 1) {
    page = 1;
  }

  if (isNaN(pageSize) || pageSize < 1) {
    pageSize = defaultPageSize;
  } else if (pageSize > maxPageSize) {
    pageSize = maxPageSize;
  }

  const skip = (page - 1) * pageSize;
  const take = pageSize;

  return {
    page,
    pageSize,
    skip,
    take,
  };
}

module.exports = {
  getPaginationParams,
};
