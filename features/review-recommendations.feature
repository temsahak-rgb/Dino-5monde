@implemented @review
Feature: Actionable review recommendations
  Recorded learning difficulties should become a short list of real lessons
  and focused vocabulary sessions that the learner can open immediately.

  Scenario: Repeated mistakes become one lesson recommendation
    Given a learner made 2 mistakes in grammar lesson "A1-G-001"
    When review recommendations are prepared
    Then one recommendation links to "/grammar/lesson/A1-G-001"
    And the recommendation reports 2 mistakes

  Scenario: A reviewed difficulty stays removed on a stale device
    Given a weak word was recorded on an older device
    And the weak word was reviewed on a newer device
    When both review signals are merged
    Then the review signal remains inactive
