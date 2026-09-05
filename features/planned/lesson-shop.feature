@shop
Feature: Lesson Shop
  Learners spend credits on durable lesson access, while every purchase keeps
  the wallet balance and lesson entitlement consistent.

  @implemented
  Scenario: A starter wallet has 100 credits
    Given an authenticated learner without a credit wallet
    When the starter wallet is created
    Then the learner has 100 credits

  @implemented
  Scenario: An authenticated learner purchases an unowned lesson atomically
    Given an authenticated learner with 100 credits
    And the Shop lesson "grammar-c1-g-001" costs 30 credits
    And the Shop lesson is not yet owned
    When the learner purchases the Shop lesson
    Then the Shop purchase succeeds
    And the learner has 70 credits
    And the learner owns exactly one entitlement for the Shop lesson

  @implemented
  Scenario: An owned lesson does not debit the wallet twice
    Given an authenticated learner with 70 credits
    And the Shop lesson "grammar-c1-g-001" costs 30 credits
    And the learner already owns the Shop lesson
    When the learner purchases the Shop lesson again
    Then the Shop purchase is idempotent
    And the learner still has 70 credits
    And the learner owns exactly one entitlement for the Shop lesson

  @implemented
  Scenario: Insufficient credits refuse a lesson purchase
    Given an authenticated learner with 20 credits
    And the Shop lesson "grammar-c1-g-001" costs 30 credits
    And the Shop lesson is not yet owned
    When the learner purchases the Shop lesson
    Then the Shop purchase is refused for insufficient credits
    And the learner still has 20 credits
    And no entitlement is created for the Shop lesson

  @implemented
  Scenario: An unauthenticated visitor must sign in to purchase
    Given an unauthenticated Shop visitor
    And the Shop lesson "grammar-c1-g-001" costs 30 credits
    When the visitor attempts to purchase the Shop lesson
    Then the Shop purchase requires sign-in
    And no credit wallet is debited

  @planned
  Scenario: Earn additional credits through learning
    Given an authenticated learner completes a credit-bearing activity
    When the activity reward is granted
    Then the learner wallet receives the earned credits exactly once

  @planned
  Scenario: Buy a credit pack through a real payment provider
    Given an authenticated learner selects a credit pack
    When the real payment provider confirms the payment
    Then the learner wallet receives the purchased credits exactly once
