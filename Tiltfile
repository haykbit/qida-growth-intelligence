allow_k8s_contexts('kind-qida')

docker_build(
  'qida-api',
  '.',
  dockerfile='infra/docker/api.Dockerfile',
  live_update=[
    sync('apps/api', '/app/apps/api'),
    sync('packages/analytics', '/app/packages/analytics'),
    sync('packages/contracts', '/app/packages/contracts'),
    sync('prisma', '/app/prisma'),
  ],
)

docker_build(
  'qida-web',
  '.',
  dockerfile='infra/docker/web.Dockerfile',
  live_update=[
    sync('apps/web', '/app/apps/web'),
    sync('packages/contracts', '/app/packages/contracts'),
  ],
)

k8s_yaml([
  'infra/k8s/namespace.yaml',
  'infra/k8s/postgres.yaml',
  'infra/k8s/api.yaml',
  'infra/k8s/web.yaml',
])

k8s_resource('postgres', port_forwards='5432:5432')
k8s_resource('api', resource_deps=['postgres'], port_forwards='3000:3000')
k8s_resource('web', resource_deps=['api'], port_forwards='5173:5173')

