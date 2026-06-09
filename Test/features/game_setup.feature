Feature: Game setup

  Scenario: Default setup shows 4 players
    Given I access the game page
    Then I should see 4 player name inputs
    And the Start game button should be enabled

  Scenario: Add a player
    Given I access the game page
    When I click the Add player button
    Then I should see 5 player name inputs

  Scenario: Cannot add more than 8 players
    Given I access the game page
    When I add players until there are 8
    Then the Add player button should be disabled

  Scenario: Remove a player
    Given I access the game page
    When I remove player at position 3
    Then I should see 3 player name inputs

  Scenario: Cannot remove when only 2 players remain
    Given I access the game page
    When I remove players until only 2 remain
    Then all remove buttons should be disabled

  Scenario: Start button disabled with only one valid name
    Given I access the game page
    When I clear all player names except the first one
    Then the Start game button should be disabled

  Scenario: Change a player name
    Given I access the game page
    When I change player 0 name to Ana
    Then player 0 input should have value Ana
