Feature: Place an order
  A sales person takes a customer's order and books its delivery slot.

  Background:
    Given I am on the New order page

  Scenario: Place a valid order
    When I choose the customer "Minh Chau Mart"
    And I add 3 of "Jasmine rice, 10 kg"
    And I choose the first free delivery slot
    And I place the order
    Then I see the order with the status "Placed"
    And its total is "₫810,000"

  Scenario: Refuse an empty order
    When I choose the customer "Minh Chau Mart"
    And I choose the first free delivery slot
    And I place the order
    Then I am told "Add at least one line before placing the order."
    And I am still on the New order page

  Scenario: Refuse a full slot
    Then a full delivery slot cannot be chosen, and says it is full
