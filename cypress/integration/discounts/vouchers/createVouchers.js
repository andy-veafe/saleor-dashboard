// / <reference types="cypress"/>
// / <reference types="../../../support"/>

import faker from "faker";

import { BUTTON_SELECTORS } from "../../../elements/shared/button-selectors";
import { urlList, voucherDetailsUrl } from "../../../fixtures/urlList";
import { ONE_PERMISSION_USERS } from "../../../fixtures/users";
import { createChannel } from "../../../support/api/requests/Channels";
import { completeCheckout } from "../../../support/api/requests/Checkout";
import * as channelsUtils from "../../../support/api/utils/channelsUtils";
import {
  createVoucherInChannel,
  deleteVouchersStartsWith
} from "../../../support/api/utils/discounts/vouchersUtils";
import {
  addPayment,
  createCheckoutWithVoucher
} from "../../../support/api/utils/ordersUtils";
import * as productsUtils from "../../../support/api/utils/products/productsUtils";
import filterTests from "../../../support/filterTests";
import {
  createVoucher,
  discountOptions,
  loginAndCreateCheckoutForVoucherWithDiscount
} from "../../../support/pages/discounts/vouchersPage";

filterTests({ definedTags: ["all"] }, () => {
  describe("Vouchers discounts", () => {
    const startsWith = "CyVou-";
    const productPrice = 100;
    const shippingPrice = 100;

    let defaultChannel;
    let createdChannel;
    let shippingMethod;
    let variants;
    let product;
    let address;
    let dataForCheckout;

    before(() => {
      cy.clearSessionData().loginUserViaRequest();
      channelsUtils.deleteChannelsStartsWith(startsWith);
      deleteVouchersStartsWith(startsWith);
      const name = `${startsWith}${faker.datatype.number()}`;
      productsUtils
        .createProductWithShipping({ name, productPrice, shippingPrice })
        .then(
          ({
            variantsList: variantsResp,
            defaultChannel: channel,
            shippingMethod: shippingMethodResp,
            address: addressResp,
            product: productResp
          }) => {
            variants = variantsResp;
            defaultChannel = channel;
            shippingMethod = shippingMethodResp;
            address = addressResp;
            product = productResp;
            createChannel({ name });
          }
        )
        .then(channel => {
          createdChannel = channel;
          dataForCheckout = {
            channelSlug: defaultChannel.slug,
            variantsList: variants,
            address,
            shippingMethodName: shippingMethod.name,
            auth: "token"
          };
        });
    });

    it("should create percentage voucher", () => {
      const voucherValue = 50;
      const voucherCode = `${startsWith}${faker.datatype.number()}`;
      const expectedAmount =
        (productPrice * voucherValue) / 100 + shippingPrice;
      let checkout;

      loginAndCreateCheckoutForVoucherWithDiscount({
        discount: discountOptions.PERCENTAGE,
        voucherValue,
        voucherCode,
        channelName: defaultChannel.name,
        dataForCheckout
      })
        .then(amount => {
          expect(amount).to.be.eq(expectedAmount);
          dataForCheckout.voucherCode = voucherCode;
          createCheckoutWithVoucher(dataForCheckout);
        })
        .then(resp => {
          expect(resp.addPromoCodeResp.checkout.totalPrice.gross.amount).to.eq(
            expectedAmount
          );
          checkout = resp.checkout;
          addPayment(checkout.id);
        })
        .then(() => {
          completeCheckout(checkout.id);
        })
        .then(({ order }) => {
          expect(order.id).to.be.ok;
        });
    });

    it("should create fixed price voucher", () => {
      const voucherValue = 50;
      const voucherCode = `${startsWith}${faker.datatype.number()}`;
      const expectedAmount = productPrice + shippingPrice - voucherValue;
      let checkout;

      loginAndCreateCheckoutForVoucherWithDiscount({
        discount: discountOptions.FIXED,
        voucherValue,
        voucherCode,
        channelName: defaultChannel.name,
        dataForCheckout
      })
        .then(amount => {
          expect(amount).to.be.eq(expectedAmount);
          dataForCheckout.voucherCode = voucherCode;
          createCheckoutWithVoucher(dataForCheckout);
        })
        .then(resp => {
          expect(resp.addPromoCodeResp.checkout.totalPrice.gross.amount).to.eq(
            expectedAmount
          );
          checkout = resp.checkout;
          addPayment(checkout.id);
        })
        .then(() => {
          completeCheckout(checkout.id);
        })
        .then(({ order }) => {
          expect(order.id).to.be.ok;
        });
    });

    it("should create free shipping voucher", () => {
      const voucherCode = `${startsWith}${faker.datatype.number()}`;
      const expectedAmount = productPrice;
      let checkout;

      loginAndCreateCheckoutForVoucherWithDiscount({
        discount: discountOptions.SHIPPING,
        voucherCode,
        channelName: defaultChannel.name,
        dataForCheckout
      })
        .then(amount => {
          expect(amount).to.be.eq(expectedAmount);
          dataForCheckout.voucherCode = voucherCode;
          createCheckoutWithVoucher(dataForCheckout);
        })
        .then(resp => {
          expect(resp.addPromoCodeResp.checkout.totalPrice.gross.amount).to.eq(
            expectedAmount
          );
          checkout = resp.checkout;
          addPayment(checkout.id);
        })
        .then(() => {
          completeCheckout(checkout.id);
        })
        .then(({ order }) => {
          expect(order.id).to.be.ok;
        });
    });

    it("should create voucher not available for selected channel", () => {
      const randomName = `${startsWith}${faker.datatype.number()}`;
      const voucherValue = 50;

      cy.clearSessionData()
        .loginUserViaRequest()
        .visit(urlList.vouchers);
      cy.softExpectSkeletonIsVisible();
      createVoucher({
        voucherCode: randomName,
        voucherValue,
        discountOption: discountOptions.PERCENTAGE,
        channelName: createdChannel.name
      });
      dataForCheckout.voucherCode = randomName;
      createCheckoutWithVoucher(dataForCheckout).then(
        ({ addPromoCodeResp }) => {
          const errorField = addPromoCodeResp.checkoutErrors[0].field;
          expect(errorField).to.be.eq("promoCode");
        }
      );
    });
  });
});
