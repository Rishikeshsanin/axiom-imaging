"""initial imaging schema

Revision ID: 0ba340abfddc
Revises: 
Create Date: 2026-09-02 14:22:34.040245
"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql


revision: str = '0ba340abfddc'
down_revision: Union[str, None] = None
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.create_table('alerts',
    sa.Column('id', sa.String(length=36), nullable=False),
    sa.Column('severity', sa.String(length=32), nullable=False),
    sa.Column('source_type', sa.String(length=64), nullable=False),
    sa.Column('source_id', sa.String(length=36), nullable=True),
    sa.Column('title', sa.String(length=255), nullable=False),
    sa.Column('description', sa.Text(), nullable=False),
    sa.Column('status', sa.String(length=32), nullable=False),
    sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('(CURRENT_TIMESTAMP)'), nullable=False),
    sa.Column('resolved_at', sa.DateTime(timezone=True), nullable=True),
    sa.PrimaryKeyConstraint('id'))
    op.create_table('audit_events',
    sa.Column('id', sa.String(length=36), nullable=False),
    sa.Column('actor', sa.String(length=255), nullable=True),
    sa.Column('action', sa.String(length=128), nullable=False),
    sa.Column('resource_type', sa.String(length=64), nullable=False),
    sa.Column('resource_id', sa.String(length=128), nullable=False),
    sa.Column('details', postgresql.JSONB(astext_type=sa.Text()), nullable=False),
    sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('(CURRENT_TIMESTAMP)'), nullable=False),
    sa.PrimaryKeyConstraint('id'))
    op.create_index(op.f('ix_audit_events_action'), 'audit_events', ['action'], unique=False)
    op.create_table('devices',
    sa.Column('id', sa.String(length=36), nullable=False),
    sa.Column('device_identifier', sa.String(length=128), nullable=False),
    sa.Column('name', sa.String(length=255), nullable=False),
    sa.Column('modality', sa.String(length=32), nullable=False),
    sa.Column('manufacturer', sa.String(length=255), nullable=True),
    sa.Column('model', sa.String(length=255), nullable=True),
    sa.Column('status', sa.String(length=32), nullable=False),
    sa.Column('location', sa.String(length=255), nullable=True),
    sa.Column('last_heartbeat', sa.DateTime(timezone=True), nullable=True),
    sa.Column('utilization', sa.Integer(), nullable=False),
    sa.Column('queue_depth', sa.Integer(), nullable=False),
    sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('(CURRENT_TIMESTAMP)'), nullable=False),
    sa.PrimaryKeyConstraint('id'))
    op.create_index(op.f('ix_devices_device_identifier'), 'devices', ['device_identifier'], unique=True)
    op.create_table('patients',
    sa.Column('id', sa.String(length=36), nullable=False),
    sa.Column('patient_identifier', sa.String(length=128), nullable=False),
    sa.Column('display_name', sa.String(length=255), nullable=False),
    sa.Column('birth_date', sa.Date(), nullable=True),
    sa.Column('sex', sa.String(length=32), nullable=True),
    sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('(CURRENT_TIMESTAMP)'), nullable=False),
    sa.Column('updated_at', sa.DateTime(timezone=True), server_default=sa.text('(CURRENT_TIMESTAMP)'), nullable=False),
    sa.PrimaryKeyConstraint('id'))
    op.create_index(op.f('ix_patients_patient_identifier'), 'patients', ['patient_identifier'], unique=True)
    op.create_table('imaging_orders',
    sa.Column('id', sa.String(length=36), nullable=False),
    sa.Column('patient_id', sa.String(length=36), nullable=False),
    sa.Column('requested_modality', sa.String(length=32), nullable=False),
    sa.Column('body_part', sa.String(length=128), nullable=True),
    sa.Column('priority', sa.String(length=32), nullable=False),
    sa.Column('requested_by', sa.String(length=255), nullable=False),
    sa.Column('status', sa.String(length=32), nullable=False),
    sa.Column('scheduled_device_id', sa.String(length=36), nullable=True),
    sa.Column('requested_at', sa.DateTime(timezone=True), server_default=sa.text('(CURRENT_TIMESTAMP)'), nullable=False),
    sa.Column('scheduled_at', sa.DateTime(timezone=True), nullable=True),
    sa.Column('notes', sa.Text(), nullable=True),
    sa.ForeignKeyConstraint(['patient_id'], ['patients.id']),
    sa.ForeignKeyConstraint(['scheduled_device_id'], ['devices.id']),
    sa.PrimaryKeyConstraint('id'))
    op.create_index(op.f('ix_imaging_orders_patient_id'), 'imaging_orders', ['patient_id'], unique=False)
    op.create_table('studies',
    sa.Column('id', sa.String(length=36), nullable=False),
    sa.Column('patient_id', sa.String(length=36), nullable=False),
    sa.Column('imaging_order_id', sa.String(length=36), nullable=True),
    sa.Column('study_instance_uid', sa.String(length=255), nullable=False),
    sa.Column('orthanc_study_id', sa.String(length=128), nullable=True),
    sa.Column('study_date', sa.Date(), nullable=True),
    sa.Column('study_description', sa.String(length=255), nullable=True),
    sa.Column('modality', sa.String(length=32), nullable=True),
    sa.Column('body_part_examined', sa.String(length=128), nullable=True),
    sa.Column('institution_name', sa.String(length=255), nullable=True),
    sa.Column('manufacturer', sa.String(length=255), nullable=True),
    sa.Column('status', sa.String(length=32), nullable=False),
    sa.Column('series_count', sa.Integer(), nullable=False),
    sa.Column('instance_count', sa.Integer(), nullable=False),
    sa.Column('uploaded_at', sa.DateTime(timezone=True), server_default=sa.text('(CURRENT_TIMESTAMP)'), nullable=False),
    sa.Column('validation_status', sa.String(length=32), nullable=False),
    sa.ForeignKeyConstraint(['imaging_order_id'], ['imaging_orders.id']),
    sa.ForeignKeyConstraint(['patient_id'], ['patients.id']),
    sa.PrimaryKeyConstraint('id'))
    op.create_index(op.f('ix_studies_modality'), 'studies', ['modality'], unique=False)
    op.create_index(op.f('ix_studies_patient_id'), 'studies', ['patient_id'], unique=False)
    op.create_index(op.f('ix_studies_status'), 'studies', ['status'], unique=False)
    op.create_index(op.f('ix_studies_study_instance_uid'), 'studies', ['study_instance_uid'], unique=True)
    op.create_index(op.f('ix_studies_validation_status'), 'studies', ['validation_status'], unique=False)
    op.create_table('reports',
    sa.Column('id', sa.String(length=36), nullable=False),
    sa.Column('study_id', sa.String(length=36), nullable=False),
    sa.Column('draft_text', sa.Text(), nullable=False),
    sa.Column('status', sa.String(length=32), nullable=False),
    sa.Column('created_by', sa.String(length=255), nullable=True),
    sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('(CURRENT_TIMESTAMP)'), nullable=False),
    sa.Column('updated_at', sa.DateTime(timezone=True), server_default=sa.text('(CURRENT_TIMESTAMP)'), nullable=False),
    sa.ForeignKeyConstraint(['study_id'], ['studies.id']),
    sa.PrimaryKeyConstraint('id'), sa.UniqueConstraint('study_id'))
    op.create_table('series',
    sa.Column('id', sa.String(length=36), nullable=False),
    sa.Column('study_id', sa.String(length=36), nullable=False),
    sa.Column('series_instance_uid', sa.String(length=255), nullable=False),
    sa.Column('orthanc_series_id', sa.String(length=128), nullable=True),
    sa.Column('series_number', sa.Integer(), nullable=True),
    sa.Column('description', sa.String(length=255), nullable=True),
    sa.Column('modality', sa.String(length=32), nullable=True),
    sa.Column('instance_count', sa.Integer(), nullable=False),
    sa.ForeignKeyConstraint(['study_id'], ['studies.id']), sa.PrimaryKeyConstraint('id'))
    op.create_index(op.f('ix_series_series_instance_uid'), 'series', ['series_instance_uid'], unique=True)
    op.create_index(op.f('ix_series_study_id'), 'series', ['study_id'], unique=False)
    op.create_table('workflow_events',
    sa.Column('id', sa.String(length=36), nullable=False),
    sa.Column('study_id', sa.String(length=36), nullable=True),
    sa.Column('order_id', sa.String(length=36), nullable=True),
    sa.Column('device_id', sa.String(length=36), nullable=True),
    sa.Column('event_type', sa.String(length=128), nullable=False),
    sa.Column('message', sa.Text(), nullable=False),
    sa.Column('metadata', postgresql.JSONB(astext_type=sa.Text()), nullable=False),
    sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('(CURRENT_TIMESTAMP)'), nullable=False),
    sa.ForeignKeyConstraint(['device_id'], ['devices.id']),
    sa.ForeignKeyConstraint(['order_id'], ['imaging_orders.id']),
    sa.ForeignKeyConstraint(['study_id'], ['studies.id']),
    sa.PrimaryKeyConstraint('id'))
    op.create_index(op.f('ix_workflow_events_event_type'), 'workflow_events', ['event_type'], unique=False)
    op.create_index(op.f('ix_workflow_events_study_id'), 'workflow_events', ['study_id'], unique=False)
    op.create_table('instances',
    sa.Column('id', sa.String(length=36), nullable=False),
    sa.Column('series_id', sa.String(length=36), nullable=False),
    sa.Column('sop_instance_uid', sa.String(length=255), nullable=False),
    sa.Column('orthanc_instance_id', sa.String(length=128), nullable=True),
    sa.Column('instance_number', sa.Integer(), nullable=True),
    sa.Column('rows', sa.Integer(), nullable=True),
    sa.Column('columns', sa.Integer(), nullable=True),
    sa.Column('number_of_frames', sa.Integer(), nullable=True),
    sa.ForeignKeyConstraint(['series_id'], ['series.id']), sa.PrimaryKeyConstraint('id'))
    op.create_index(op.f('ix_instances_series_id'), 'instances', ['series_id'], unique=False)
    op.create_index(op.f('ix_instances_sop_instance_uid'), 'instances', ['sop_instance_uid'], unique=True)


def downgrade() -> None:
    op.drop_index(op.f('ix_instances_sop_instance_uid'), table_name='instances')
    op.drop_index(op.f('ix_instances_series_id'), table_name='instances')
    op.drop_table('instances')
    op.drop_index(op.f('ix_workflow_events_study_id'), table_name='workflow_events')
    op.drop_index(op.f('ix_workflow_events_event_type'), table_name='workflow_events')
    op.drop_table('workflow_events')
    op.drop_index(op.f('ix_series_study_id'), table_name='series')
    op.drop_index(op.f('ix_series_series_instance_uid'), table_name='series')
    op.drop_table('series')
    op.drop_table('reports')
    op.drop_index(op.f('ix_studies_validation_status'), table_name='studies')
    op.drop_index(op.f('ix_studies_study_instance_uid'), table_name='studies')
    op.drop_index(op.f('ix_studies_status'), table_name='studies')
    op.drop_index(op.f('ix_studies_patient_id'), table_name='studies')
    op.drop_index(op.f('ix_studies_modality'), table_name='studies')
    op.drop_table('studies')
    op.drop_index(op.f('ix_imaging_orders_patient_id'), table_name='imaging_orders')
    op.drop_table('imaging_orders')
    op.drop_index(op.f('ix_patients_patient_identifier'), table_name='patients')
    op.drop_table('patients')
    op.drop_index(op.f('ix_devices_device_identifier'), table_name='devices')
    op.drop_table('devices')
    op.drop_index(op.f('ix_audit_events_action'), table_name='audit_events')
    op.drop_table('audit_events')
    op.drop_table('alerts')
