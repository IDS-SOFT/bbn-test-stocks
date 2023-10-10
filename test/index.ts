const { expect } = require('chai');
const { ethers } = require('hardhat');

describe('SecurityToken', function () {
  let SecurityToken:any;
  let securityToken:any;
  let owner:any;
  let investor:any;
  let custodian:any;

  const offeringName = 'Token Offering';
  const offeringType = 'Equity';
  const totalShares = 100000;
  const sharePrice = 100;

  beforeEach(async function () {
    [owner, investor, custodian] = await ethers.getSigners();

    // Deploy the SecurityToken contract
    SecurityToken = await ethers.getContractFactory('SecurityToken');
    securityToken = await SecurityToken.deploy(
        'Security Token',
        'ST',
        offeringName,
        offeringType,
        totalShares,
        sharePrice,
        custodian.address
    );
    await securityToken.connect(owner).deployed();

  });

  it('should issue and redeem shares', async function () {
    // Issue shares to the investor
    const initialBalance = await securityToken.balanceOf(investor.address);
    const issuedShares = 1000;
    await securityToken.connect(owner).issueShares(investor.address, issuedShares);

    // Check the investor's balance
    const investorBalance = await securityToken.balanceOf(investor.address);
    expect(investorBalance).to.equal(initialBalance.add(issuedShares));

    // Redeem shares from the investor
    const redeemedShares = 500;
    await securityToken.connect(owner).redeemShares(investor.address, redeemedShares);

    // Check the investor's balance after redemption
    const finalBalance = await securityToken.balanceOf(investor.address);
    expect(finalBalance).to.equal(investorBalance.sub(redeemedShares));
  });

  it('should not issue more shares than totalShares', async function () {
    const initialIssuedShares = await securityToken.issuedShares();

    // Attempt to issue more shares than totalShares
    const issuedShares = totalShares + 1;
    await expect(securityToken.connect(owner).issueShares(investor.address, issuedShares)).to.be.revertedWith(
      'Exceeds total available shares'
    );

    // Check that the issuedShares did not change
    const finalIssuedShares = await securityToken.issuedShares();
    expect(finalIssuedShares).to.equal(initialIssuedShares);
  });

  it('should not redeem more shares than the investor has', async function () {
    const issuedShares = 1000;
    await securityToken.connect(owner).issueShares(investor.address, issuedShares);

    // Attempt to redeem more shares than the investor has
    const investorBalance = await securityToken.balanceOf(investor.address);
    const redeemedShares = investorBalance + 1;
    await expect(securityToken.connect(owner).redeemShares(investor.address, redeemedShares)).to.be.revertedWith(
      'Insufficient balance'
    );
  });
});
