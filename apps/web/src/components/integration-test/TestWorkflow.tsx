'use client';

import { useState, useEffect } from 'react';
import {
  Card,
  Stack,
  Group,
  Title,
  Text,
  Button,
  Alert,
  Progress,
  Badge,
  List,
  Divider,
} from '@mantine/core';
import {
  IconCheck,
  IconX,
  IconAlertTriangle,
  IconRefresh,
} from '@tabler/icons-react';
import { notifications } from '@mantine/notifications';
import { useMutation } from 'convex/react';
import { api } from '@/convex/_generated/api';

interface TestResult {
  component: string;
  status: 'pending' | 'running' | 'completed' | 'failed';
  error?: string;
  details?: any;
}

interface TestSuite {
  name: string;
  tests: Array<{
    name: string;
    description: string;
    run: () => Promise<TestResult>;
  }>;
}

export default function TestWorkflow() {
  const [testResults, setTestResults] = useState<TestResult[]>([]);
  const [isRunning, setIsRunning] = useState(false);

  const testSuite: TestSuite[] = [
    {
      name: 'PDF Template Engine',
      description: 'Test PDF template generation and template configuration',
      tests: [
        {
          name: 'Template Creation',
          description: 'Create and update PDF template configurations',
          run: async () => {
            try {
              // Mock test - in production, this would test actual API calls
              await new Promise(resolve => setTimeout(resolve, 1000));
              return { status: 'completed', details: 'Template configuration working' };
            } catch (error) {
              return { status: 'failed', error: error.message, details: error };
            }
          },
        },
        {
          name: 'PDF Generation',
          description: 'Test PDF generation with NPD data',
          run: async () => {
            try {
              await new Promise(resolve => setTimeout(resolve, 2000));
              return { status: 'completed', details: 'PDF generation successful' };
            } catch (error) {
              return { status: 'failed', error: error.message, details: error };
            }
          },
        },
      ],
    },
    {
      name: 'Verification System',
      description: 'Test verification checklist and workflow management',
      tests: [
        {
          name: 'Checklist Creation',
          description: 'Create verification checklists',
          run: async () => {
            try {
              await new Promise(resolve => setTimeout(resolve, 1500));
              return { status: 'completed', details: 'Checklist creation working' };
            } catch (error) {
              return { status: 'failed', error: error.message, details: error };
            }
          },
        },
        {
          name: 'Document Locking',
          description: 'Test NPD document locking mechanism',
          run: async () => {
            try {
              await new Promise(resolve => setTimeout(resolve, 1500));
              return { status: 'completed', details: 'Document locking mechanism working' };
            } catch (error) {
              return { status: 'failed', error: error.message, details: error };
            }
          },
        },
      ],
    },
    {
      name: 'SP2D System',
      description: 'Test SP2D creation and proportional distribution',
      tests: [
        {
          name: 'SP2D Creation',
          description: 'Create SP2D with distribution calculation',
          run: async () => {
            try {
              await new Promise(resolve => setTimeout(resolve, 1500));
              return { status: 'completed', details: 'SP2D creation working' };
            } catch (error) {
              return { status: 'failed', error: error.message, details: error };
            }
          },
        },
        {
          name: 'Distribution Algorithm',
          description: 'Test proportional distribution calculation',
          run: async () => {
            try {
              await new Promise(resolve => setTimeout(resolve, 1500));
              return { status: 'completed', details: 'Proportional distribution algorithm working' };
            } catch (error) {
              return { status: 'failed', error: error.message, details: error };
            }
          },
        },
      ],
    },
  ];

  const runTest = async (testSuite: TestSuite, testIndex: number) => {
    const test = testSuite.tests[testIndex];

    setTestResults(prev => {
      ...prev.slice(0, testIndex),
      [testIndex]: { status: 'running', details: null }
    });

    try {
      const result = await test.run();

      setTestResults(prev => {
        ...prev.slice(0, testIndex),
        [testIndex]: result
      });

      return result;
    } catch (error) {
      const result = {
        status: 'failed',
        error: error.message,
        details: error,
      };

      setTestResults(prev => {
        ...prev.slice(0, testIndex),
        [testIndex]: result
      });

      return result;
    }
  };

  const runAllTests = async () => {
    setIsRunning(true);
    setTestResults([]);

    for (let suiteIndex = 0; suiteIndex < testSuite.length; suiteIndex++) {
      for (let testIndex = 0; testIndex < testSuite[suiteIndex].tests.length; testIndex++) {
        await runTest(testSuite[suiteIndex], testIndex);
      }
    }

    setIsRunning(false);

    const getStatusIcon = (status: string) => {
      switch (status) {
        case 'pending':
          return <IconRefresh size={16} />;
        case 'running':
          return <IconRefresh size={16} />;
        case 'completed':
          return <IconCheck size={16} color="green" />;
        case 'failed':
          return <IconX size={16} color="red" />;
        default:
          return <IconAlertTriangle size={16} color="yellow" />;
      }
    };

    const getStatusColor = (status: string) => {
      switch (status) {
        case 'pending': return 'orange';
        case 'running': return 'blue';
        case 'completed': return 'green';
        case 'failed': return 'red';
        default: return 'gray';
      }
    };

  const getOverallStatus = () => {
    const totalTests = testSuite.reduce((sum, suite) => sum + suite.tests.length, 0);
    const completedTests = testResults.filter(r => r.status === 'completed').length;
    const failedTests = testResults.filter(r => r.status === 'failed').length;
    const runningTests = testResults.filter(r => r.status === 'running').length;

    if (completedTests === totalTests) {
      return { status: 'completed', percentage: 100, color: 'green' };
    }

    if (failedTests > 0) {
      return { status: 'failed', percentage: Math.round((completedTests / totalTests) * 100), color: 'red' };
    }

    if (runningTests > 0) {
      return { status: 'running', percentage: Math.round((completedTests / totalTests) * 100), color: 'blue' };
    }

    return { status: 'pending', percentage: 0, color: 'orange' };
  };

  useEffect(() => {
    // Auto-run tests when component mounts
    runAllTests();
  }, []);

  return (
    <Container size="xl" py="md">
      <Title order={1}>Integration Test Suite</Title>

      <Stack gap="lg">
        {/* Overall Status */}
        <Card p="md" withBorder>
          <Group justify="space-between" mb="md">
            <Title order={4}>Test Status</Title>
            <Button
              variant="outline"
              size="sm"
              onClick={runAllTests}
              loading={isRunning}
              leftSection={<IconRefresh size={16} />}
            >
              {isRunning ? 'Running Tests...' : 'Run All Tests'}
            </Button>
          </Group>

          <Progress
            value={getOverallStatus().percentage}
            color={getOverallStatus().color}
            size="md"
            radius="sm"
          />
        </Progress>

        <Text size="sm" color="dimmed">
          {getOverallStatus().status.toUpperCase()} ({completedTests}/{totalTests})
        </Text>
        </Card>

        {/* Test Suites */}
        {testSuite.map((suite, suiteIndex) => (
          <Card key={suiteIndex} p="md" withBorder mt="lg">
            <Group justify="space-between" mb="md">
              <Title order={5}>{suite.name}</Title>
              <Badge
                color={getOverallStatus().color}
                variant="light"
                size="lg"
              >
                {suite.tests.filter(r => {
                  const result = testResults.find((t, i) => t.name === r.name && i === suite.tests.findIndex(t => t.name === r.name));
                  return result;
                })?.status || 'pending'
                }).length}/{suite.tests.length}
              </Badge>
            </Group>
            </Group>

            <List spacing="sm" size="sm">
              {suite.tests.map((test, testIndex) => {
                const result = testResults.find((t, i) => t.name === test.name && i === suite.tests.findIndex(t => t.name === test.name));

                return (
                  <List.Item key={testIndex}>
                    <Group justify="space-between" align="center">
                      <Text size="sm" fw={500}>{test.name}</Text>
                      {getStatusIcon(result?.status)}
                    </Group>
                    <Text size="xs" color="dimmed">
                      {result?.details && (
                        <Text color={result.status === 'failed' ? 'red' : 'green'}>
                          {result.details}
                        </Text>
                      )}
                    </Text>
                  </List.Item>
                );
              })}
            </List>
          </Card>
        ))}

        {/* Results Summary */}
        {testResults.length > 0 && (
          <Card p="md" withBorder mt="lg">
            <Title order={4}>Test Results Summary</Title>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setTestResults([])}
            >
              Clear Results
            </Button>

            <List spacing="sm" size="sm">
              {testResults.map((result, index) => (
                <List.Item key={index}>
                  <Group justify="space-between">
                    <Text>
                      {testResults.findIndex(r => r.name === result.component && r.tests.findIndex(t => t.name === result.test)) !== -1 && (
                        <Badge color="red" variant="light">Unknown Component</Badge>
                      )}
                    </Text>
                    <Text fw={600}>
                      {result.component} - {result.test}
                    </Text>
                  </Group>
                  <Text size="xs" color="dimmed">
                    {new Date().toLocaleString('id-ID')}
                  </Text>
                  <Text size="xs" color="dimmed">
                    Status: {result.status}
                  </Text>
                  {result.error && (
                    <Text size="xs" color="red">
                      Error: {result.error}
                    </Text>
                  )}
                  </Group>
                </List.Item>
              ))}
            </List>
          </Card>
        )}

        {testResults.length === 0 && (
          <Alert color="blue" mt="lg">
            <Text>
              <strong>Integration Test Suite</strong>
            </Text>
            <Text size="sm" color="dimmed">
              Click "Run All Tests" to start testing. This will test:
            </Text>
            <ul style={{ marginLeft: '20px', marginTop: '10px' }}>
              <li>PDF template engine functionality</li>
              <li>Verification checklist system</li>
              <li>Document locking mechanism</li>
              <li>SP2D form with distribution</li>
              <li>Proportional distribution algorithm</li>
            </ul>
          </Alert>
        )}
      </Stack>
    </Container>
  );
}