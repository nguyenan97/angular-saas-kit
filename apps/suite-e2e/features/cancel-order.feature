Feature: Cancel an order
  A placed order can be cancelled with a reason; a cancelled order stays cancelled.

  Scenario: Cancel with a reason
    Given a placed order
    When I cancel it with the reason "Wrong address"
    Then I see the order with the status "Cancelled"
    And its history ends with "Cancelled" and the reason "Wrong address"

  Scenario: No Cancel button on a cancelled order
    Given a cancelled order
    Then there is no Cancel order button
