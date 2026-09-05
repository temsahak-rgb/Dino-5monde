@implemented @navigation
Feature: Shareable application navigation
  Public learning content must have a durable URL that can be copied,
  reloaded and resolved to the same destination.

  Scenario Outline: A public content destination has a canonical path
    Given a "<kind>" destination identified by "<identifier>"
    When its canonical public path is created
    Then the public path is "<path>"
    And resolving the path selects the same destination

    Examples:
      | kind            | identifier           | path                           |
      | grammar lesson  | A1-G-003-B           | /grammar/lesson/A1-G-003-B     |
      | journal article | 2026-w34-azadi-tower | /journal/2026-w34-azadi-tower  |
      | travel lesson   | suite 13 shopping    | /travel/suite%2013%20shopping  |

  Scenario: An unknown public path is rejected
    Given the public path "/missing-content"
    When the public path is resolved
    Then no application destination is selected
