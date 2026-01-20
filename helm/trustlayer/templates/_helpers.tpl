{{/*
Expand the name of the chart.
*/}}
{{- define "trustlayer.name" -}}
{{- default .Chart.Name .Values.nameOverride | trunc 63 | trimSuffix "-" }}
{{- end }}

{{/*
Create a default fully qualified app name.
*/}}
{{- define "trustlayer.fullname" -}}
{{- if .Values.fullnameOverride }}
{{- .Values.fullnameOverride | trunc 63 | trimSuffix "-" }}
{{- else }}
{{- $name := default .Chart.Name .Values.nameOverride }}
{{- if contains $name .Release.Name }}
{{- .Release.Name | trunc 63 | trimSuffix "-" }}
{{- else }}
{{- printf "%s-%s" .Release.Name $name | trunc 63 | trimSuffix "-" }}
{{- end }}
{{- end }}
{{- end }}

{{/*
Create chart name and version as used by the chart label.
*/}}
{{- define "trustlayer.chart" -}}
{{- printf "%s-%s" .Chart.Name .Chart.Version | replace "+" "_" | trunc 63 | trimSuffix "-" }}
{{- end }}

{{/*
Common labels
*/}}
{{- define "trustlayer.labels" -}}
helm.sh/chart: {{ include "trustlayer.chart" . }}
{{ include "trustlayer.selectorLabels" . }}
{{- if .Chart.AppVersion }}
app.kubernetes.io/version: {{ .Chart.AppVersion | quote }}
{{- end }}
app.kubernetes.io/managed-by: {{ .Release.Service }}
{{- end }}

{{/*
Selector labels
*/}}
{{- define "trustlayer.selectorLabels" -}}
app.kubernetes.io/name: {{ include "trustlayer.name" . }}
app.kubernetes.io/instance: {{ .Release.Name }}
{{- end }}

{{/*
Create the name of the service account to use
*/}}
{{- define "trustlayer.serviceAccountName" -}}
{{- if .Values.serviceAccount.create }}
{{- default (include "trustlayer.fullname" .) .Values.serviceAccount.name }}
{{- else }}
{{- default "default" .Values.serviceAccount.name }}
{{- end }}
{{- end }}

{{/*
PostgreSQL hostname
*/}}
{{- define "trustlayer.postgresql.host" -}}
{{- if .Values.postgresql.external.enabled }}
{{- .Values.postgresql.external.host }}
{{- else }}
{{- printf "%s-postgresql" (include "trustlayer.fullname" .) }}
{{- end }}
{{- end }}

{{/*
PostgreSQL port
*/}}
{{- define "trustlayer.postgresql.port" -}}
{{- if .Values.postgresql.external.enabled }}
{{- .Values.postgresql.external.port }}
{{- else }}
{{- 5432 }}
{{- end }}
{{- end }}

{{/*
PostgreSQL database
*/}}
{{- define "trustlayer.postgresql.database" -}}
{{- if .Values.postgresql.external.enabled }}
{{- .Values.postgresql.external.database }}
{{- else }}
{{- .Values.postgresql.auth.database }}
{{- end }}
{{- end }}

{{/*
Supabase URL
*/}}
{{- define "trustlayer.supabase.url" -}}
{{- if .Values.supabase.external.enabled }}
{{- .Values.supabase.external.url }}
{{- else }}
{{- printf "http://%s-kong:8000" (include "trustlayer.fullname" .) }}
{{- end }}
{{- end }}
