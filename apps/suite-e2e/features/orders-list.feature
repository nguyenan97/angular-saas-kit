Feature: Find orders
  The orders list filters by status and finds an order by its id.

  Background:
    Given I am on the Orders page

  Scenario: Filter by status
    When I open the "Cancelled" tab
    Then every order listed is "Cancelled"
    And the address says "status=cancelled"

  Scenario: Find an order by its id
    When I search for "SO-0007"
    Then the only order listed is "SO-0007"
