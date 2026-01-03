import assert from "assert";
import { 
  TestHelpers,
  ERC20PeriodTransferEnforcer_TransferredInPeriod
} from "generated";
const { MockDb, ERC20PeriodTransferEnforcer } = TestHelpers;

describe("ERC20PeriodTransferEnforcer contract TransferredInPeriod event tests", () => {
  // Create mock db
  const mockDb = MockDb.createMockDb();

  // Creating mock for ERC20PeriodTransferEnforcer contract TransferredInPeriod event
  const event = ERC20PeriodTransferEnforcer.TransferredInPeriod.createMockEvent({/* It mocks event fields with default values. You can overwrite them if you need */});

  it("ERC20PeriodTransferEnforcer_TransferredInPeriod is created correctly", async () => {
    // Processing the event
    const mockDbUpdated = await ERC20PeriodTransferEnforcer.TransferredInPeriod.processEvent({
      event,
      mockDb,
    });

    // Getting the actual entity from the mock database
    let actualERC20PeriodTransferEnforcerTransferredInPeriod = mockDbUpdated.entities.ERC20PeriodTransferEnforcer_TransferredInPeriod.get(
      `${event.chainId}_${event.block.number}_${event.logIndex}`
    );

    // Creating the expected entity
    const expectedERC20PeriodTransferEnforcerTransferredInPeriod: ERC20PeriodTransferEnforcer_TransferredInPeriod = {
      id: `${event.chainId}_${event.block.number}_${event.logIndex}`,
      sender: event.params.sender,
      redeemer: event.params.redeemer,
      delegationHash: event.params.delegationHash,
      token: event.params.token,
      periodAmount: event.params.periodAmount,
      periodDuration: event.params.periodDuration,
      startDate: event.params.startDate,
      transferredInCurrentPeriod: event.params.transferredInCurrentPeriod,
      transferTimestamp: event.params.transferTimestamp,
    };
    // Asserting that the entity in the mock database is the same as the expected entity
    assert.deepEqual(actualERC20PeriodTransferEnforcerTransferredInPeriod, expectedERC20PeriodTransferEnforcerTransferredInPeriod, "Actual ERC20PeriodTransferEnforcerTransferredInPeriod should be the same as the expectedERC20PeriodTransferEnforcerTransferredInPeriod");
  });
});
