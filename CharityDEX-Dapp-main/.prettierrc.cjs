module.exports = {
  semi: true,
  trailingComma: 'all',
  singleQuote: true,
  printWidth: 120,
  tabWidth: 2,
  jsxSingleQuote: true,
  plugins: [require.resolve('@trivago/prettier-plugin-sort-imports')],
  importOrder: ['^react(-dom/client)?$', '<THIRD_PARTY_MODULES>', '^[.]{2}', '^[.]'],
  importOrderSeparation: true,
  importOrderSortSpecifiers: true,
};
