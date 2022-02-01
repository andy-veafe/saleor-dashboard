export const VOUCHERS_SELECTORS = {
  createVoucherButton: "[data-test-id='create-voucher']",
  voucherCodeInput: "[name='code']",
  discountRadioButtons: "[name='discountType']",
  percentageDiscountRadioButton:
    "[name='discountType'][value='VALUE_PERCENTAGE']",
  fixedDiscountRadioButton: "[name='discountType'][value='VALUE_FIXED']",
  shippingDiscountRadioButton: "[name='discountType'][value='SHIPPING']",
  discountValueInputs: "[name='value']",
  startDateInput: '[name="startDate"]',
  endDateInput: '[name="endDate"]',
  hasEndDateCheckbox: '[name="hasEndDate"]',
  endTimeInput: '[name="endTime"]',
  assignCountryButton: '[data-test-id="assign-country"]',
  countriesDropdownIcon: '[data-test-id="countries-drop-down-icon"]'
};
